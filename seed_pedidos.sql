-- ============================================================
-- SEED: 30 pedidos de teste
-- Ajuste v_empresa para o código da sua empresa antes de rodar
-- ============================================================

DO $$
DECLARE
  v_empresa INT := 1;   -- << altere para o código da sua empresa
  pid       INT;
BEGIN

  -- ── Outubro 2024 ─────────────────────────────────────────

  INSERT INTO calhas.pedidos (cod_empresa, cod_cliente, data_pedido, status, valor_material, valor_servico, valor_total, excluido, estoque_baixado, created_at, updated_at)
  VALUES (v_empresa, 1, '2024-10-05', 6, 150.00, 150.00, 300.00, false, false, NOW(), NOW()) RETURNING id INTO pid;
  INSERT INTO calhas.pedidos_itens (cod_pedido, cod_produto, tipo, quantidade, valor_unitario, valor_total, custo_unitario)
  VALUES (pid, 4, 10, 3, 50.00, 150.00, 0);

  INSERT INTO calhas.pedidos (cod_empresa, cod_cliente, data_pedido, status, valor_material, valor_servico, valor_total, excluido, estoque_baixado, created_at, updated_at)
  VALUES (v_empresa, 2, '2024-10-12', 8, 170.00, 170.00, 340.00, false, false, NOW(), NOW()) RETURNING id INTO pid;
  INSERT INTO calhas.pedidos_itens (cod_pedido, cod_produto, tipo, quantidade, valor_unitario, valor_total, custo_unitario)
  VALUES (pid, 3, 10, 2, 85.00, 170.00, 0);

  INSERT INTO calhas.pedidos (cod_empresa, cod_cliente, data_pedido, status, valor_material, valor_servico, valor_total, excluido, estoque_baixado, created_at, updated_at)
  VALUES (v_empresa, 1, '2024-10-20', 8, 120.00, 120.00, 240.00, false, false, NOW(), NOW()) RETURNING id INTO pid;
  INSERT INTO calhas.pedidos_itens (cod_pedido, cod_produto, tipo, quantidade, valor_unitario, valor_total, custo_unitario)
  VALUES (pid, 5, 10, 1, 120.00, 120.00, 0);

  INSERT INTO calhas.pedidos (cod_empresa, cod_cliente, data_pedido, status, valor_material, valor_servico, valor_total, excluido, estoque_baixado, created_at, updated_at)
  VALUES (v_empresa, 2, '2024-10-28', 9, 200.00, 200.00, 400.00, false, false, NOW(), NOW()) RETURNING id INTO pid;
  INSERT INTO calhas.pedidos_itens (cod_pedido, cod_produto, tipo, quantidade, valor_unitario, valor_total, custo_unitario)
  VALUES (pid, 10, 10, 1, 200.00, 200.00, 0);

  -- ── Novembro 2024 ────────────────────────────────────────

  INSERT INTO calhas.pedidos (cod_empresa, cod_cliente, data_pedido, status, valor_material, valor_servico, valor_total, excluido, estoque_baixado, created_at, updated_at)
  VALUES (v_empresa, 1, '2024-11-03', 6, 250.00, 250.00, 500.00, false, false, NOW(), NOW()) RETURNING id INTO pid;
  INSERT INTO calhas.pedidos_itens (cod_pedido, cod_produto, tipo, quantidade, valor_unitario, valor_total, custo_unitario)
  VALUES (pid, 4, 10, 5, 50.00, 250.00, 0);

  INSERT INTO calhas.pedidos (cod_empresa, cod_cliente, data_pedido, status, valor_material, valor_servico, valor_total, excluido, estoque_baixado, created_at, updated_at)
  VALUES (v_empresa, 2, '2024-11-10', 6, 340.00, 340.00, 680.00, false, false, NOW(), NOW()) RETURNING id INTO pid;
  INSERT INTO calhas.pedidos_itens (cod_pedido, cod_produto, tipo, quantidade, valor_unitario, valor_total, custo_unitario)
  VALUES (pid, 3, 10, 4, 85.00, 340.00, 0);

  INSERT INTO calhas.pedidos (cod_empresa, cod_cliente, data_pedido, status, valor_material, valor_servico, valor_total, excluido, estoque_baixado, created_at, updated_at)
  VALUES (v_empresa, 1, '2024-11-15', 7, 240.00, 240.00, 480.00, false, false, NOW(), NOW()) RETURNING id INTO pid;
  INSERT INTO calhas.pedidos_itens (cod_pedido, cod_produto, tipo, quantidade, valor_unitario, valor_total, custo_unitario)
  VALUES (pid, 5, 10, 2, 120.00, 240.00, 0);

  INSERT INTO calhas.pedidos (cod_empresa, cod_cliente, data_pedido, status, valor_material, valor_servico, valor_total, excluido, estoque_baixado, created_at, updated_at)
  VALUES (v_empresa, 2, '2024-11-22', 8, 400.00, 400.00, 800.00, false, false, NOW(), NOW()) RETURNING id INTO pid;
  INSERT INTO calhas.pedidos_itens (cod_pedido, cod_produto, tipo, quantidade, valor_unitario, valor_total, custo_unitario)
  VALUES (pid, 4, 10, 8, 50.00, 400.00, 0);

  INSERT INTO calhas.pedidos (cod_empresa, cod_cliente, data_pedido, status, valor_material, valor_servico, valor_total, excluido, estoque_baixado, created_at, updated_at)
  VALUES (v_empresa, 1, '2024-11-28', 6, 400.00, 400.00, 800.00, false, false, NOW(), NOW()) RETURNING id INTO pid;
  INSERT INTO calhas.pedidos_itens (cod_pedido, cod_produto, tipo, quantidade, valor_unitario, valor_total, custo_unitario)
  VALUES (pid, 10, 10, 2, 200.00, 400.00, 0);

  -- ── Dezembro 2024 ────────────────────────────────────────

  INSERT INTO calhas.pedidos (cod_empresa, cod_cliente, data_pedido, status, valor_material, valor_servico, valor_total, excluido, estoque_baixado, created_at, updated_at)
  VALUES (v_empresa, 2, '2024-12-02', 6, 510.00, 510.00, 1020.00, false, false, NOW(), NOW()) RETURNING id INTO pid;
  INSERT INTO calhas.pedidos_itens (cod_pedido, cod_produto, tipo, quantidade, valor_unitario, valor_total, custo_unitario)
  VALUES (pid, 3, 10, 6, 85.00, 510.00, 0);

  INSERT INTO calhas.pedidos (cod_empresa, cod_cliente, data_pedido, status, valor_material, valor_servico, valor_total, excluido, estoque_baixado, created_at, updated_at)
  VALUES (v_empresa, 1, '2024-12-08', 7, 500.00, 500.00, 1000.00, false, false, NOW(), NOW()) RETURNING id INTO pid;
  INSERT INTO calhas.pedidos_itens (cod_pedido, cod_produto, tipo, quantidade, valor_unitario, valor_total, custo_unitario)
  VALUES (pid, 4, 10, 10, 50.00, 500.00, 0);

  INSERT INTO calhas.pedidos (cod_empresa, cod_cliente, data_pedido, status, valor_material, valor_servico, valor_total, excluido, estoque_baixado, created_at, updated_at)
  VALUES (v_empresa, 2, '2024-12-15', 8, 360.00, 360.00, 720.00, false, false, NOW(), NOW()) RETURNING id INTO pid;
  INSERT INTO calhas.pedidos_itens (cod_pedido, cod_produto, tipo, quantidade, valor_unitario, valor_total, custo_unitario)
  VALUES (pid, 5, 10, 3, 120.00, 360.00, 0);

  INSERT INTO calhas.pedidos (cod_empresa, cod_cliente, data_pedido, status, valor_material, valor_servico, valor_total, excluido, estoque_baixado, created_at, updated_at)
  VALUES (v_empresa, 1, '2024-12-20', 9, 200.00, 200.00, 400.00, false, false, NOW(), NOW()) RETURNING id INTO pid;
  INSERT INTO calhas.pedidos_itens (cod_pedido, cod_produto, tipo, quantidade, valor_unitario, valor_total, custo_unitario)
  VALUES (pid, 10, 10, 1, 200.00, 200.00, 0);

  INSERT INTO calhas.pedidos (cod_empresa, cod_cliente, data_pedido, status, valor_material, valor_servico, valor_total, excluido, estoque_baixado, created_at, updated_at)
  VALUES (v_empresa, 2, '2024-12-28', 6, 200.00, 200.00, 400.00, false, false, NOW(), NOW()) RETURNING id INTO pid;
  INSERT INTO calhas.pedidos_itens (cod_pedido, cod_produto, tipo, quantidade, valor_unitario, valor_total, custo_unitario)
  VALUES (pid, 4, 10, 4, 50.00, 200.00, 0);

  -- ── Janeiro 2025 ─────────────────────────────────────────

  INSERT INTO calhas.pedidos (cod_empresa, cod_cliente, data_pedido, status, valor_material, valor_servico, valor_total, excluido, estoque_baixado, created_at, updated_at)
  VALUES (v_empresa, 1, '2025-01-05', 6, 255.00, 255.00, 510.00, false, false, NOW(), NOW()) RETURNING id INTO pid;
  INSERT INTO calhas.pedidos_itens (cod_pedido, cod_produto, tipo, quantidade, valor_unitario, valor_total, custo_unitario)
  VALUES (pid, 3, 10, 3, 85.00, 255.00, 0);

  INSERT INTO calhas.pedidos (cod_empresa, cod_cliente, data_pedido, status, valor_material, valor_servico, valor_total, excluido, estoque_baixado, created_at, updated_at)
  VALUES (v_empresa, 2, '2025-01-12', 8, 120.00, 120.00, 240.00, false, false, NOW(), NOW()) RETURNING id INTO pid;
  INSERT INTO calhas.pedidos_itens (cod_pedido, cod_produto, tipo, quantidade, valor_unitario, valor_total, custo_unitario)
  VALUES (pid, 5, 10, 1, 120.00, 120.00, 0);

  INSERT INTO calhas.pedidos (cod_empresa, cod_cliente, data_pedido, status, valor_material, valor_servico, valor_total, excluido, estoque_baixado, created_at, updated_at)
  VALUES (v_empresa, 1, '2025-01-18', 6, 350.00, 350.00, 700.00, false, false, NOW(), NOW()) RETURNING id INTO pid;
  INSERT INTO calhas.pedidos_itens (cod_pedido, cod_produto, tipo, quantidade, valor_unitario, valor_total, custo_unitario)
  VALUES (pid, 4, 10, 7, 50.00, 350.00, 0);

  INSERT INTO calhas.pedidos (cod_empresa, cod_cliente, data_pedido, status, valor_material, valor_servico, valor_total, excluido, estoque_baixado, created_at, updated_at)
  VALUES (v_empresa, 2, '2025-01-25', 7, 600.00, 600.00, 1200.00, false, false, NOW(), NOW()) RETURNING id INTO pid;
  INSERT INTO calhas.pedidos_itens (cod_pedido, cod_produto, tipo, quantidade, valor_unitario, valor_total, custo_unitario)
  VALUES (pid, 10, 10, 3, 200.00, 600.00, 0);

  -- ── Fevereiro 2025 ───────────────────────────────────────

  INSERT INTO calhas.pedidos (cod_empresa, cod_cliente, data_pedido, status, valor_material, valor_servico, valor_total, excluido, estoque_baixado, created_at, updated_at)
  VALUES (v_empresa, 1, '2025-02-03', 6, 425.00, 425.00, 850.00, false, false, NOW(), NOW()) RETURNING id INTO pid;
  INSERT INTO calhas.pedidos_itens (cod_pedido, cod_produto, tipo, quantidade, valor_unitario, valor_total, custo_unitario)
  VALUES (pid, 3, 10, 5, 85.00, 425.00, 0);

  INSERT INTO calhas.pedidos (cod_empresa, cod_cliente, data_pedido, status, valor_material, valor_servico, valor_total, excluido, estoque_baixado, created_at, updated_at)
  VALUES (v_empresa, 2, '2025-02-10', 8, 600.00, 600.00, 1200.00, false, false, NOW(), NOW()) RETURNING id INTO pid;
  INSERT INTO calhas.pedidos_itens (cod_pedido, cod_produto, tipo, quantidade, valor_unitario, valor_total, custo_unitario)
  VALUES (pid, 4, 10, 12, 50.00, 600.00, 0);

  INSERT INTO calhas.pedidos (cod_empresa, cod_cliente, data_pedido, status, valor_material, valor_servico, valor_total, excluido, estoque_baixado, created_at, updated_at)
  VALUES (v_empresa, 1, '2025-02-15', 6, 240.00, 240.00, 480.00, false, false, NOW(), NOW()) RETURNING id INTO pid;
  INSERT INTO calhas.pedidos_itens (cod_pedido, cod_produto, tipo, quantidade, valor_unitario, valor_total, custo_unitario)
  VALUES (pid, 5, 10, 2, 120.00, 240.00, 0);

  INSERT INTO calhas.pedidos (cod_empresa, cod_cliente, data_pedido, status, valor_material, valor_servico, valor_total, excluido, estoque_baixado, created_at, updated_at)
  VALUES (v_empresa, 2, '2025-02-22', 6, 200.00, 200.00, 400.00, false, false, NOW(), NOW()) RETURNING id INTO pid;
  INSERT INTO calhas.pedidos_itens (cod_pedido, cod_produto, tipo, quantidade, valor_unitario, valor_total, custo_unitario)
  VALUES (pid, 10, 10, 1, 200.00, 200.00, 0);

  -- ── Março 2025 ───────────────────────────────────────────

  INSERT INTO calhas.pedidos (cod_empresa, cod_cliente, data_pedido, status, valor_material, valor_servico, valor_total, excluido, estoque_baixado, created_at, updated_at)
  VALUES (v_empresa, 1, '2025-03-01', 7, 300.00, 300.00, 600.00, false, false, NOW(), NOW()) RETURNING id INTO pid;
  INSERT INTO calhas.pedidos_itens (cod_pedido, cod_produto, tipo, quantidade, valor_unitario, valor_total, custo_unitario)
  VALUES (pid, 4, 10, 6, 50.00, 300.00, 0);

  INSERT INTO calhas.pedidos (cod_empresa, cod_cliente, data_pedido, status, valor_material, valor_servico, valor_total, excluido, estoque_baixado, created_at, updated_at)
  VALUES (v_empresa, 2, '2025-03-08', 6, 170.00, 170.00, 340.00, false, false, NOW(), NOW()) RETURNING id INTO pid;
  INSERT INTO calhas.pedidos_itens (cod_pedido, cod_produto, tipo, quantidade, valor_unitario, valor_total, custo_unitario)
  VALUES (pid, 3, 10, 2, 85.00, 170.00, 0);

  INSERT INTO calhas.pedidos (cod_empresa, cod_cliente, data_pedido, status, valor_material, valor_servico, valor_total, excluido, estoque_baixado, created_at, updated_at)
  VALUES (v_empresa, 1, '2025-03-15', 6, 480.00, 480.00, 960.00, false, false, NOW(), NOW()) RETURNING id INTO pid;
  INSERT INTO calhas.pedidos_itens (cod_pedido, cod_produto, tipo, quantidade, valor_unitario, valor_total, custo_unitario)
  VALUES (pid, 5, 10, 4, 120.00, 480.00, 0);

  INSERT INTO calhas.pedidos (cod_empresa, cod_cliente, data_pedido, status, valor_material, valor_servico, valor_total, excluido, estoque_baixado, created_at, updated_at)
  VALUES (v_empresa, 2, '2025-03-22', 8, 400.00, 400.00, 800.00, false, false, NOW(), NOW()) RETURNING id INTO pid;
  INSERT INTO calhas.pedidos_itens (cod_pedido, cod_produto, tipo, quantidade, valor_unitario, valor_total, custo_unitario)
  VALUES (pid, 10, 10, 2, 200.00, 400.00, 0);

  INSERT INTO calhas.pedidos (cod_empresa, cod_cliente, data_pedido, status, valor_material, valor_servico, valor_total, excluido, estoque_baixado, created_at, updated_at)
  VALUES (v_empresa, 1, '2025-03-28', 6, 450.00, 450.00, 900.00, false, false, NOW(), NOW()) RETURNING id INTO pid;
  INSERT INTO calhas.pedidos_itens (cod_pedido, cod_produto, tipo, quantidade, valor_unitario, valor_total, custo_unitario)
  VALUES (pid, 4, 10, 9, 50.00, 450.00, 0);

  -- ── Abril 2025 ───────────────────────────────────────────

  INSERT INTO calhas.pedidos (cod_empresa, cod_cliente, data_pedido, status, valor_material, valor_servico, valor_total, excluido, estoque_baixado, created_at, updated_at)
  VALUES (v_empresa, 2, '2025-04-05', 6, 595.00, 595.00, 1190.00, false, false, NOW(), NOW()) RETURNING id INTO pid;
  INSERT INTO calhas.pedidos_itens (cod_pedido, cod_produto, tipo, quantidade, valor_unitario, valor_total, custo_unitario)
  VALUES (pid, 3, 10, 7, 85.00, 595.00, 0);

  INSERT INTO calhas.pedidos (cod_empresa, cod_cliente, data_pedido, status, valor_material, valor_servico, valor_total, excluido, estoque_baixado, created_at, updated_at)
  VALUES (v_empresa, 1, '2025-04-10', 6, 120.00, 120.00, 240.00, false, false, NOW(), NOW()) RETURNING id INTO pid;
  INSERT INTO calhas.pedidos_itens (cod_pedido, cod_produto, tipo, quantidade, valor_unitario, valor_total, custo_unitario)
  VALUES (pid, 5, 10, 1, 120.00, 120.00, 0);

  INSERT INTO calhas.pedidos (cod_empresa, cod_cliente, data_pedido, status, valor_material, valor_servico, valor_total, excluido, estoque_baixado, created_at, updated_at)
  VALUES (v_empresa, 2, '2025-04-15', 7, 600.00, 600.00, 1200.00, false, false, NOW(), NOW()) RETURNING id INTO pid;
  INSERT INTO calhas.pedidos_itens (cod_pedido, cod_produto, tipo, quantidade, valor_unitario, valor_total, custo_unitario)
  VALUES (pid, 10, 10, 3, 200.00, 600.00, 0);

  RAISE NOTICE '30 pedidos inseridos com sucesso.';
END $$;
