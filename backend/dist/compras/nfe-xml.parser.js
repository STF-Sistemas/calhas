"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDanfeXml = parseDanfeXml;
exports.buildDanfeFromDb = buildDanfeFromDb;
exports.lerNfeParaImportacao = lerNfeParaImportacao;
const xml2js_1 = require("xml2js");
async function parseDanfeXml(xmlContent) {
    const parsed = await (0, xml2js_1.parseStringPromise)(xmlContent, { explicitArray: false, ignoreAttrs: false });
    const nfeRoot = parsed['nfeProc'] ?? parsed['NFe'];
    const nfe = nfeRoot?.['NFe'] ?? nfeRoot;
    const infNFe = nfe?.['infNFe'];
    const protNFe = parsed['nfeProc']?.['protNFe']?.['infProt'];
    const ide = infNFe?.['ide'] ?? {};
    const emit = infNFe?.['emit'] ?? {};
    const dest = infNFe?.['dest'] ?? {};
    const total = infNFe?.['total']?.['ICMSTot'] ?? {};
    const transp = infNFe?.['transp'] ?? {};
    const cobr = infNFe?.['cobr'];
    const infAdic = infNFe?.['infAdic'];
    const rawDets = infNFe?.['det'];
    const dets = Array.isArray(rawDets) ? rawDets : rawDets ? [rawDets] : [];
    const chave = (infNFe?.['$']?.['Id'] ?? '').replace('NFe', '').trim();
    const emitente = {
        razao_social: emit['xNome'] ?? '',
        nome_fantasia: emit['xFant'],
        cnpj: emit['CNPJ'] ?? '',
        ie: emit['IE'],
        iest: emit['IEST'],
        crt: Number(emit['CRT'] ?? 1),
        logradouro: emit['enderEmit']?.['xLgr'],
        numero: emit['enderEmit']?.['nro'],
        complemento: emit['enderEmit']?.['xCpl'],
        bairro: emit['enderEmit']?.['xBairro'],
        municipio: emit['enderEmit']?.['xMun'],
        uf: emit['enderEmit']?.['UF'],
        cep: emit['enderEmit']?.['CEP'],
        fone: emit['enderEmit']?.['fone'],
    };
    const destinatario = {
        razao_social: dest['xNome'] ?? '',
        cnpj: dest['CNPJ'],
        cpf: dest['CPF'],
        ie: dest['IE'],
        logradouro: dest['enderDest']?.['xLgr'],
        numero: dest['enderDest']?.['nro'],
        complemento: dest['enderDest']?.['xCpl'],
        bairro: dest['enderDest']?.['xBairro'],
        municipio: dest['enderDest']?.['xMun'],
        uf: dest['enderDest']?.['UF'],
        cep: dest['enderDest']?.['CEP'],
        fone: dest['enderDest']?.['fone'],
        email: dest['email'],
    };
    const itens = dets.map((det, i) => {
        const prod = det['prod'] ?? {};
        const imposto = det['imposto'] ?? {};
        const icms = imposto['ICMS'] ?? {};
        const icmsGrupo = Object.values(icms)[0] ?? {};
        const ipi = imposto['IPI'] ?? {};
        const ipiTrib = (ipi['IPITrib'] ?? ipi['IPINT'] ?? {});
        const cst = (icmsGrupo['CST'] ?? icmsGrupo['CSOSN'] ?? '');
        return {
            num: i + 1,
            codigo: String(prod['cProd'] ?? ''),
            descricao: String(prod['xProd'] ?? ''),
            ncm: String(prod['NCM'] ?? ''),
            cst,
            cfop: String(prod['CFOP'] ?? ''),
            unidade: String(prod['uCom'] ?? 'UN'),
            quantidade: Number(prod['qCom'] ?? 0),
            valor_unitario: Number(prod['vUnCom'] ?? 0),
            valor_total: Number(prod['vProd'] ?? 0),
            base_icms: Number(icmsGrupo['vBC'] ?? 0),
            valor_icms: Number(icmsGrupo['vICMS'] ?? 0),
            aliq_icms: Number(icmsGrupo['pICMS'] ?? 0),
            base_icms_st: Number(icmsGrupo['vBCST'] ?? 0),
            valor_icms_st: Number(icmsGrupo['vICMSST'] ?? 0),
            valor_ipi: Number(ipiTrib['vIPI'] ?? 0),
            aliq_ipi: Number(ipiTrib['pIPI'] ?? 0),
            desconto: Number(prod['vDesc'] ?? 0),
        };
    });
    const totais = {
        base_icms: Number(total['vBC'] ?? 0),
        valor_icms: Number(total['vICMS'] ?? 0),
        base_icms_st: Number(total['vBCST'] ?? 0),
        valor_icms_st: Number(total['vST'] ?? 0),
        valor_produtos: Number(total['vProd'] ?? 0),
        valor_frete: Number(total['vFrete'] ?? 0),
        valor_seguro: Number(total['vSeg'] ?? 0),
        desconto: Number(total['vDesc'] ?? 0),
        outros: Number(total['vOutro'] ?? 0),
        valor_ipi: Number(total['vIPI'] ?? 0),
        valor_total: Number(total['vNF'] ?? 0),
    };
    const transpVol = Array.isArray(transp['vol']) ? transp['vol'][0] : transp['vol'];
    const transporte = {
        modalidade_frete: String(transp['modFrete'] ?? '9'),
        transportadora: transp['transporta']?.['xNome'],
        cnpj: transp['transporta']?.['CNPJ'],
        ie: transp['transporta']?.['IE'],
        endereco: transp['transporta']?.['xEnder'],
        municipio: transp['transporta']?.['xMun'],
        uf: transp['transporta']?.['UF'],
        placa: transp['veicTransp']?.['placa'],
        uf_veiculo: transp['veicTransp']?.['UF'],
        rntc: transp['veicTransp']?.['RNTC'],
        quantidade_volumes: transpVol ? Number(transpVol['qVol'] ?? 0) : undefined,
        especie: transpVol?.['esp'],
        marca: transpVol?.['marca'],
        numero_volumes: transpVol?.['nVol'],
        peso_liquido: transpVol ? Number(transpVol['pesoL'] ?? 0) : undefined,
        peso_bruto: transpVol ? Number(transpVol['pesoB'] ?? 0) : undefined,
    };
    let faturas;
    if (cobr?.['dup']) {
        const dups = Array.isArray(cobr['dup']) ? cobr['dup'] : [cobr['dup']];
        faturas = dups.map((d) => ({
            numero: String(d['nDup'] ?? ''),
            vencimento: String(d['dVenc'] ?? ''),
            valor: Number(d['vDup'] ?? 0),
        }));
    }
    return {
        source: 'xml',
        chave_acesso: chave || undefined,
        protocolo: protNFe?.['nProt'],
        data_protocolo: protNFe?.['dhRecbto'],
        natureza_operacao: ide['natOp'],
        tipo_operacao: Number(ide['tpNF'] ?? 0),
        numero_nfe: ide['nNF'],
        serie: ide['serie'],
        data_emissao: ide['dhEmi'] ?? ide['dEmi'],
        data_saida: ide['dhSaiEnt'] ?? ide['dSaiEnt'],
        emitente,
        destinatario,
        itens,
        totais,
        transporte,
        faturas,
        info_complementar: infAdic?.['infCpl'],
    };
}
function buildDanfeFromDb(compra, empresa) {
    const fornecedor = compra.fornecedor;
    const emitente = {
        razao_social: fornecedor?.razao_social ?? '',
        nome_fantasia: fornecedor?.nome_fantasia,
        cnpj: fornecedor?.cnpj ?? '',
        ie: fornecedor?.ie,
        logradouro: fornecedor?.logradouro,
        numero: fornecedor?.numero,
        complemento: fornecedor?.complemento,
        bairro: fornecedor?.bairro,
        municipio: fornecedor?.cidade?.descricao,
        uf: fornecedor?.cidade?.uf,
        cep: fornecedor?.cep,
        fone: fornecedor?.fone,
    };
    const destinatario = empresa ? {
        razao_social: empresa.razao_social,
        cnpj: empresa.cnpj,
        logradouro: empresa.endereco,
        numero: empresa.numero,
        complemento: empresa.complemento,
        bairro: empresa.bairro,
        municipio: empresa.cidade?.descricao,
        uf: empresa.cidade?.uf,
        cep: empresa.cep,
    } : undefined;
    const itens = compra.itens.map((item, i) => ({
        num: i + 1,
        codigo: String(item.cod_produto),
        descricao: item.descricao_xml || item.descricao,
        ncm: item.ncm,
        cfop: item.cfop,
        unidade: item.unidade,
        quantidade: Number(item.quantidade),
        valor_unitario: Number(item.valor_unitario),
        valor_total: Number(item.valor_total),
        base_icms: Number(item.base_icms),
        valor_icms: Number(item.valor_icms),
        aliq_icms: Number(item.aliq_icms),
        base_icms_st: Number(item.base_icms_st),
        valor_icms_st: Number(item.valor_icms_st),
        valor_ipi: Number(item.valor_ipi),
        desconto: Number(item.desconto),
    }));
    const totais = {
        base_icms: itens.reduce((s, i) => s + (i.base_icms ?? 0), 0),
        valor_icms: itens.reduce((s, i) => s + (i.valor_icms ?? 0), 0),
        base_icms_st: itens.reduce((s, i) => s + (i.base_icms_st ?? 0), 0),
        valor_icms_st: itens.reduce((s, i) => s + (i.valor_icms_st ?? 0), 0),
        valor_produtos: Number(compra.valor_produtos),
        valor_frete: Number(compra.valor_frete),
        valor_seguro: Number(compra.valor_seguro),
        desconto: Number(compra.valor_desconto),
        outros: Number(compra.valor_outros),
        valor_ipi: Number(compra.valor_ipi),
        valor_total: Number(compra.valor_total),
    };
    return {
        source: 'db',
        chave_acesso: compra.chave_acesso || undefined,
        numero_nfe: compra.numero_nfe,
        serie: compra.serie,
        data_emissao: compra.data_emissao?.toISOString(),
        data_saida: compra.data_entrada?.toISOString(),
        emitente,
        destinatario,
        itens,
        totais,
        transporte: { modalidade_frete: '9' },
        info_complementar: compra.observacao,
    };
}
async function lerNfeParaImportacao(xmlContent) {
    const parsed = await (0, xml2js_1.parseStringPromise)(xmlContent, { explicitArray: false, ignoreAttrs: false });
    const nfeRoot = parsed?.['nfeProc'] ?? parsed?.['NFe'];
    if (!nfeRoot)
        return { erro: 'XML inválido: estrutura NF-e não reconhecida.' };
    const nfe = nfeRoot['NFe'] ?? nfeRoot;
    const infNFe = nfe['infNFe'];
    if (!infNFe)
        return { erro: 'XML inválido: tag infNFe não encontrada.' };
    const ide = infNFe['ide'];
    const emit = infNFe['emit'];
    const total = infNFe['total']?.['ICMSTot'];
    const transp = infNFe['transp'];
    const rawDets = infNFe['det'];
    const dets = Array.isArray(rawDets) ? rawDets : rawDets ? [rawDets] : [];
    const itens = dets.map((det) => {
        const prod = det['prod'] ?? {};
        const imposto = det['imposto'] ?? {};
        const icmsGrupo = (Object.values(imposto['ICMS'] ?? {})[0] ?? {});
        const ipi = imposto['IPI'] ?? {};
        const ipiTrib = ipi['IPITrib'] ?? ipi['IPINT'] ?? {};
        const pis = imposto['PIS'] ?? {};
        const pisAliq = pis['PISAliq'] ?? pis['PISNT'] ?? {};
        const cofins = imposto['COFINS'] ?? {};
        const cofinsAliq = cofins['COFINSAliq'] ?? cofins['COFINSNT'] ?? {};
        const gtin = String(prod['cEAN'] ?? '').trim();
        return {
            cod_produto: null,
            cProd: String(prod['cProd'] ?? '').trim(),
            gtin: gtin === 'SEM GTIN' ? '' : gtin,
            descricao: String(prod['xProd'] ?? ''),
            ncm: String(prod['NCM'] ?? ''),
            cfop: String(prod['CFOP'] ?? ''),
            unidade: String(prod['uCom'] ?? prod['uTrib'] ?? 'UN'),
            quantidade: Number(prod['qCom'] ?? prod['qTrib'] ?? 0),
            valor_unitario: Number(prod['vUnCom'] ?? 0),
            valor_total: Number(prod['vProd'] ?? 0),
            desconto: Number(prod['vDesc'] ?? 0),
            base_icms: Number(icmsGrupo['vBC'] ?? 0),
            aliq_icms: Number(icmsGrupo['pICMS'] ?? 0),
            valor_icms: Number(icmsGrupo['vICMS'] ?? 0),
            base_icms_st: Number(icmsGrupo['vBCST'] ?? 0),
            valor_icms_st: Number(icmsGrupo['vICMSST'] ?? 0),
            valor_ipi: Number(ipiTrib['vIPI'] ?? 0),
            aliq_pis: Number(pisAliq['pPIS'] ?? 0),
            valor_pis: Number(pisAliq['vPIS'] ?? 0),
            aliq_cofins: Number(cofinsAliq['pCOFINS'] ?? 0),
            valor_cofins: Number(cofinsAliq['vCOFINS'] ?? 0),
        };
    });
    const ender = emit?.['enderEmit'] ?? {};
    return {
        chave_acesso: String(infNFe['$']?.['Id'] ?? '').replace('NFe', '').trim(),
        numero_nfe: ide?.['nNF'] ?? '',
        serie: ide?.['serie'] ?? '',
        data_emissao: ide?.['dhEmi'] ?? ide?.['dEmi'] ?? null,
        valor_frete: Number(transp?.['vol']?.['vTroco'] ?? total?.['vFrete'] ?? 0),
        valor_seguro: Number(total?.['vSeg'] ?? 0),
        valor_desconto: Number(total?.['vDesc'] ?? 0),
        valor_outros: Number(total?.['vOutro'] ?? 0),
        emitente: {
            cnpj: String(emit?.['CNPJ'] ?? '').replace(/\D/g, ''),
            razao_social: emit?.['xNome'] ?? '',
            nome_fantasia: emit?.['xFant'] ?? '',
            ie: emit?.['IE'] ?? '',
            crt: Number(emit?.['CRT'] ?? 1),
            fone: ender['fone'] ?? '',
            cep: String(ender['CEP'] ?? '').replace(/\D/g, ''),
            logradouro: ender['xLgr'] ?? '',
            numero: ender['nro'] ?? '',
            complemento: ender['xCpl'] ?? '',
            bairro: ender['xBairro'] ?? '',
            municipio: ender['xMun'] ?? '',
            cod_ibge: ender['cMun'] ?? '',
            uf: ender['UF'] ?? '',
        },
        itens,
    };
}
//# sourceMappingURL=nfe-xml.parser.js.map