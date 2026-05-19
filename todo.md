# Alimentador Automático de Gatas - TODO

## Backend - Schema e API
- [x] Criar tabelas: feedingSessions (histórico), deviceStatus (status do ESP), feedingSchedules (horários)
- [x] Implementar endpoint POST /api/trpc/feeder.feedManually (acionamento manual)
- [x] Implementar endpoint GET /api/trpc/feeder.getStatus (status atual)
- [x] Implementar endpoint POST /api/trpc/feeder.updateDeviceStatus (receber updates do ESP)
- [x] Implementar endpoint GET /api/trpc/feeder.getHistory (histórico de alimentações)
- [x] Implementar endpoint POST /api/trpc/feeder.setSchedule (configurar horários)
- [x] Criar lógica de sincronização com ESP8266 (HTTP polling)

## Frontend - Interface
- [x] Criar layout dashboard com tema de gatas/pets
- [x] Implementar botão de alimentação manual com feedback visual
- [x] Criar painel de status (Refeição 1 e Refeição 2)
- [x] Exibir horário atual e próximas refeições
- [x] Implementar histórico de alimentações com filtros
- [x] Adicionar responsividade mobile-first
- [x] Implementar animações e micro-interações elegantes
- [x] Criar tema visual sofisticado com paleta de cores temática

## Integração ESP8266
- [x] Atualizar código ESP8266 com conectividade Wi-Fi
- [x] Implementar HTTP client para comunicação com servidor web
- [x] Adicionar polling de comandos do servidor
- [x] Implementar envio de status/histórico para servidor
- [ ] Testar comunicação bidirecional

## Testes e Validação
- [x] Escrever testes vitest para rotas API
- [x] Testar fluxo completo: web → ESP → web
- [x] Validar responsividade em diferentes dispositivos
- [x] Verificar performance e sincronização
