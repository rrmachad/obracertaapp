## Contexto
As 3 Edge Functions de cobrança Stripe (`create-checkout`, `stripe-webhook`, `check-subscription`) precisam ser atualizadas com novos mapeamentos de preço/produto (v4 BRL) e depois deployadas.

## Mudanças Identificadas

### create-checkout
- Atualiza os `priceId` dos planos `start` e `gold` na moeda BRL para os novos valores v4.
- `start` BRL: `price_1TlJkLDaZO2bVcEo3NatnxRx`
- `gold` BRL: `price_1TlJm9DaZO2bVcEoZyEsOVQl`
- `premium` BRL permanece inalterado.

### stripe-webhook
- Adiciona 2 novos `productId` v4 BRL ao mapeamento `productToPlans`.
- `prod_UkpPpyTTfKQ8vd` → `start`
- `prod_UkpR48UA8gv0jf` → `gold`
- Reclassifica os produtos BRL existentes como `v3 BRL (legacy)` nos comentários.

### check-subscription
- Idêntico ao stripe-webhook: adiciona os 2 mesmos `productId` v4 BRL ao mapeamento `productToPlans`.
- Reclassifica os produtos BRL existentes como `v3 BRL (legacy)` nos comentários.

## Execução
1. Reescrever o conteúdo dos 3 arquivos em `supabase/functions/<nome>/index.ts` exatamente como fornecido pelo usuário.
2. Executar o deploy das 3 funções via `supabase--deploy_edge_functions`.
3. Verificar os logs de deploy para confirmar sucesso.

## Nota
Nenhuma mudança no schema do banco, nas secrets ou no frontend é necessária. Todos os secrets (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, etc.) já estão configurados no projeto.