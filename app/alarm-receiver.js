android.content.BroadcastReceiver.extend("org.homesync.AlarmReceiver", {
    onReceive: function (context, intent) {
        console.log("⏰ Recebido o alarme, iniciando serviço... ");

        const serviceIntent = new android.content.Intent(context, java.lang.Class.forName("org.homesync.myservice"));
        // Verifique a versão do Android antes de chamar startForegroundService
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) { // O is API 26
            context.startForegroundService(serviceIntent);
        } else {
            context.startService(serviceIntent);
        }
    }
});
