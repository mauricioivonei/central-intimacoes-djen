# Central de Intimacoes DJEN

Sistema web para gestao de intimacoes do DJEN/Comunica PJe, com foco em prazos processuais, providencias e controle de agenda.

## O que o sistema faz

- Pesquisa publicacoes pela regra principal de nome do advogado.
- Permite OAB/UF apenas como filtro auxiliar.
- Consulta a API oficial do Comunica PJe/DJEN.
- Identifica numero do processo, tribunal, classe, partes e advogados.
- Extrai comando da decisao e transcricao da ordem judicial.
- Mostra data de divulgacao, data de publicacao, prazo sugerido, prazo fatal e alerta 3 dias antes.
- Permite confirmar ou ajustar a data sugerida.
- Gera link pronto para lancar a tarefa no Google Agenda.

## Publicacao recomendada no Vercel

1. Acesse https://vercel.com/new.
2. Importe o repositorio `mauricioivonei/central-intimacoes-djen`.
3. Escolha framework `Next.js`.
4. Mantenha:
   - Install Command: `npm install`
   - Build Command: `npm run build`
   - Output Directory: deixe em branco
5. Publique.

O sistema usa uma rota de servidor em `/api/djen` para consultar a API oficial:

`https://comunicaapi.pje.jus.br/api/v1/comunicacao`

## Variaveis opcionais

Normalmente nao precisa configurar nada. Se a API mudar, use:

- `DJEN_COMUNICA_API_BASE`
- `DJEN_COMUNICA_API_ENDPOINT`

## Desenvolvimento local

```bash
npm install
npm run dev
```

## Conferencia

```bash
npm test
```

O teste usa o build compativel com Sites/Cloudflare para validar a renderizacao principal e os campos juridicos essenciais.
