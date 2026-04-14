-- =============================================================================
-- Trigger: controle automático de estoque por pedido
-- Executa BEFORE UPDATE em calhas.pedidos
--
-- Só atua se empresa.validar_estoque = TRUE
--
-- Regras (status: 6=Aberto 7=EmProducao 8=Concluido 9=Cancelado):
--   Aberto → EmProducao/Concluido : SUBTRAI quantidades do estoque
--   Produtivo → Aberto            : DEVOLVE quantidades ao estoque
--   Qualquer → Cancelado (baixado): DEVOLVE quantidades ao estoque
--   excluido FALSE→TRUE (baixado) : DEVOLVE quantidades ao estoque
--
-- Por ser BEFORE trigger, pode modificar NEW diretamente (sem recursão).
-- =============================================================================

CREATE OR REPLACE FUNCTION calhas.fn_controle_estoque_pedido()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_validar_estoque BOOLEAN;
BEGIN
  -- ── Transição para produtivo (EmProducao=7 ou Concluido=8) ───────────────────
  -- Só baixa se ainda não estava baixado e o status anterior não era produtivo
  IF NEW.status IN (7, 8)
     AND OLD.status NOT IN (7, 8)
     AND NOT OLD.estoque_baixado
  THEN
    UPDATE calhas.produtos p
    SET estoque_atual = p.estoque_atual - pi.quantidade
    FROM calhas.pedidos_itens pi
    WHERE pi.cod_pedido = NEW.id
      AND pi.cod_produto IS NOT NULL
      AND p.id = pi.cod_produto;

    NEW.estoque_baixado := TRUE;

  -- ── Retorno de produtivo para Aberto (6) ────────────────────────────────────
  -- Usado na edição de itens: app seta Aberto → trigger devolve → itens são
  -- atualizados → app seta produtivo → trigger debita novamente
  ELSIF OLD.status IN (7, 8)
     AND NEW.status = 6
     AND OLD.estoque_baixado
  THEN
    UPDATE calhas.produtos p
    SET estoque_atual = p.estoque_atual + pi.quantidade
    FROM calhas.pedidos_itens pi
    WHERE pi.cod_pedido = NEW.id
      AND pi.cod_produto IS NOT NULL
      AND p.id = pi.cod_produto;

    NEW.estoque_baixado := FALSE;

  -- ── Cancelamento com estoque baixado ────────────────────────────────────────
  ELSIF NEW.status = 9 AND OLD.estoque_baixado THEN
    UPDATE calhas.produtos p
    SET estoque_atual = p.estoque_atual + pi.quantidade
    FROM calhas.pedidos_itens pi
    WHERE pi.cod_pedido = NEW.id
      AND pi.cod_produto IS NOT NULL
      AND p.id = pi.cod_produto;

    NEW.estoque_baixado := FALSE;

  -- ── Soft-delete de pedido com estoque baixado ───────────────────────────────
  ELSIF NOT OLD.excluido AND NEW.excluido AND OLD.estoque_baixado THEN
    UPDATE calhas.produtos p
    SET estoque_atual = p.estoque_atual + pi.quantidade
    FROM calhas.pedidos_itens pi
    WHERE pi.cod_pedido = NEW.id
      AND pi.cod_produto IS NOT NULL
      AND p.id = pi.cod_produto;

    NEW.estoque_baixado := FALSE;
  END IF;

  RETURN NEW;
END;
$$;

-- Remove trigger anterior se existir
DROP TRIGGER IF EXISTS trg_controle_estoque_pedido ON calhas.pedidos;

CREATE TRIGGER trg_controle_estoque_pedido
  BEFORE UPDATE ON calhas.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION calhas.fn_controle_estoque_pedido();
