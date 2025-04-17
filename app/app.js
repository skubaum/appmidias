import { Application } from '@nativescript/core';

Application.run({ moduleName: 'app-root' });

if (Application.android) {
    Application.android.on(Application.AndroidApplication.activityStartedEvent, function (args) {
        const context = args.activity.getApplicationContext();
        const alarmManager = context.getSystemService(android.content.Context.ALARM_SERVICE);

        const intent = new android.content.Intent(context, java.lang.Class.forName("org.homesync.myservice"));
		const pendingIntent = android.app.PendingIntent.getService(
			context,
			0,
			intent,
			android.app.PendingIntent.FLAG_IMMUTABLE
		);

        const intervalMillis = 3 * 1000 * 60; // 10 minutos
		const triggerAtMillis = java.lang.System.currentTimeMillis() + 20 * 1000;

		alarmManager.setRepeating(
			android.app.AlarmManager.RTC_WAKEUP,
			triggerAtMillis,
			intervalMillis,
			pendingIntent
		);

        console.log("⏳ Serviço configurado para cada 30 minutos");
    });
}

import * as application from "@nativescript/core/application";

//permitir usar sockets na tread principal
application.android.on('activityCreated', function activityCreated(args) {
	android.os.StrictMode.setThreadPolicy(new android.os.StrictMode.ThreadPolicy.Builder().permitAll().build())
})
