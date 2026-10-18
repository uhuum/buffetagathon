package br.com.buffetagathon.agenda;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.RingtoneManager;
import android.os.Build;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class AgathonMessagingService extends FirebaseMessagingService {
    public static final String CHANNEL_ID = "agathon_alertas";

    public static void createAlertChannel(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID, "Avisos de festas", NotificationManager.IMPORTANCE_HIGH);
            channel.setDescription("Novas festas, alteracoes, cancelamentos e lembretes");
            channel.enableVibration(true);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PRIVATE);
            channel.setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION), null);
            context.getSystemService(NotificationManager.class).createNotificationChannel(channel);
        }
    }

    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);
        getSharedPreferences("agathon", MODE_PRIVATE).edit()
            .putString("fcm_token", token).apply();
        // Sem credenciais no servico: a pagina autenticada salva o token quando abrir.
    }

    @Override
    public void onMessageReceived(RemoteMessage message) {
        // Notificacoes com titulo/corpo sao exibidas automaticamente pelo
        // Firebase em background; em primeiro plano exibimos aqui.
        String title = message.getNotification() != null
            ? message.getNotification().getTitle() : message.getData().get("title");
        String body = message.getNotification() != null
            ? message.getNotification().getBody() : message.getData().get("body");
        if (title == null) title = "Agenda Agathon";
        if (body == null) body = "Voce recebeu uma nova notificacao.";
        createAlertChannel(this);

        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder notification = new Notification.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_agathon_status)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new Notification.BigTextStyle().bigText(body))
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .setPriority(Notification.PRIORITY_HIGH)
            .setVisibility(Notification.VISIBILITY_PRIVATE);
        getSystemService(NotificationManager.class)
            .notify((int) (System.currentTimeMillis() & 0x7fffffff), notification.build());
    }
}
