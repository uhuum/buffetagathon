# Agenda Agathon — aplicativo Android com Firebase nativo

O projeto Android abre o sistema atual em https://agathonapp.netlify.app/ e
usa Firebase Cloud Messaging nativo para notificacoes (sem depender do Chrome).
A agenda, login, banco Supabase e o PWA continuam sendo os mesmos.

## Etapa obrigatoria — registrar aplicativo Android no Firebase

1. Acesse https://console.firebase.google.com/ e abra o projeto **buffet-agathonn**.
2. Abra Configuracoes do projeto > Seus apps > Adicionar app > Android.
3. Digite **br.com.buffetagathon.agenda** como nome do pacote Android.
4. Registre o aplicativo e baixe o arquivo **google-services.json**.
5. Coloque o arquivo em **android-native/app/google-services.json**.
   O arquivo esta ignorado pelo Git.

Sem registrar este novo aplicativo no Firebase, nao e possivel compilar e
testar corretamente as notificacoes nativas.

## Gerar APK no Android Studio

1. Instale Android Studio (JDK 17, Android SDK 35).
2. Abra a pasta **android-native** como projeto Gradle.
3. Aguarde a sincronizacao de dependencias.
4. Selecione Build > Build APK(s).
5. O APK de teste estara em app/build/outputs/apk/debug/app-debug.apk.
6. Instale no Android autorizado e permita notificacoes quando solicitado.

Pelo terminal, se Gradle 8.9 e Android SDK ja estiverem instalados:
    cd android-native
    gradle assembleDebug

## Gerar APK no GitHub

1. No GitHub, abra Settings > Secrets and variables > Actions.
2. Crie o segredo **AGATHON_GOOGLE_SERVICES_JSON_B64** contendo
   o conteudo base64 do arquivo google-services.json.
   No Linux: base64 -w 0 android-native/app/google-services.json
   No macOS: base64 < android-native/app/google-services.json | tr -d '\n'
3. Abra Actions > Agenda Agathon - APK Android > Run workflow.
4. Baixe o artefato **agenda-agathon-android-debug**.

## Como testar

1. Instale o APK, conceda permissao de notificacao e faca login no Agathon.
2. Abra Configuracoes > Painel de Notificacoes pelo sistema e verifique que
   aparece um dispositivo com nome **Agenda Agathon (Android)**.
3. Envie uma notificacao de teste.
4. Teste em primeiro plano, em segundo plano e com a tela bloqueada.
5. Na configuracao Android, ajuste Agenda Agathon > Notificacoes >
   Avisos de festas para **Alerta/Mostrar como pop-up**.

## Integracao e limitacoes

- Canal nativo de alerta: agathon_alertas (importancia alta).
- Em background o Firebase Android mostra a notificacao; com o aplicativo
  aberto a exibicao e feita por AgathonMessagingService.
- O site so registra o token nativo depois de login. O PWA continua com
  Firebase Web Push; nao e necessario reinstalar o PWA de outros usuarios.
- A interface web depende de internet e PDF em formato blob no WebView
  pode exigir ajuste adicional para download/compartilhamento.
- Android pode suprimir os banners em Nao Perturbe ou por configuracoes
  do usuario; importancia alta nao substitui permissao do sistema.
- O APK debug e apenas para teste; para distribuicao definitiva,
  assine um APK release com sua chave privada.
- Antes de disponibilizar publicamente, revisar a protecao da API
  de registro de tokens de dispositivos.
