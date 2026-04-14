-- =============================================================================
-- Trigger: controle automático de estoque por compra
-- Executa AFTER UPDATE em calhas.compras
--
-- Regras:
--   status 1 → 2 (Rascunho → Confirmada) : ADICIONA quantidades ao estoque
--   status 2 → 3 (Confirmada → Cancelada) : REVERTE quantidades do estoque
--   excluido FALSE → TRUE com status = 2   : REVERTE quantidades do estoque
-- =============================================================================

CREATE OR REPLACE FUNCTION calhas.fn_controle_estoque_compra()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Confirmar compra: adiciona estoque
  IF OLD.status = 1 AND NEW.status = 2 THEN
    UPDATE calhas.produtos p
    SET estoque_atual = p.estoque_atual + ci.quantidade
    FROM calhas.compras_itens ci
    WHERE ci.cod_compra = NEW.id
      AND ci.excluido = FALSE
      AND p.id = ci.cod_produto;

  -- Cancelar compra confirmada: reverte estoque
  ELSIF OLD.status = 2 AND NEW.status = 3 THEN
    UPDATE calhas.produtos p
    SET estoque_atual = p.estoque_atual - ci.quantidade
    FROM calhas.compras_itens ci
    WHERE ci.cod_compra = NEW.id
      AND ci.excluido = FALSE
      AND p.id = ci.cod_produto;

  -- Soft-delete de compra confirmada: reverte estoque
  ELSIF OLD.excluido = FALSE AND NEW.excluido = TRUE AND OLD.status = 2 THEN
    UPDATE calhas.produtos p
    SET estoque_atual = p.estoque_atual - ci.quantidade
    FROM calhas.compras_itens ci
    WHERE ci.cod_compra = NEW.id
      AND ci.excluido = FALSE
      AND p.id = ci.cod_produto;
  END IF;

  RETURN NEW;
END;
$$;

-- Remove trigger anterior se existir
DROP TRIGGER IF EXISTS trg_controle_estoque_compra ON calhas.compras;

CREATE TRIGGER trg_controle_estoque_compra
  AFTER UPDATE ON calhas.compras
  FOR EACH ROW
  EXECUTE FUNCTION calhas.fn_controle_estoque_compra();
