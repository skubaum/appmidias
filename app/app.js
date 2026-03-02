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

		const intervalMillis = 10 * 60 * 1000; // 10 minutos
		const triggerAtMillis = java.lang.System.currentTimeMillis() + 10 * 1000;

		context.getSharedPreferences("ServicePrefs", 0)
			.edit()
			.putLong("intervalMillis", intervalMillis)
			.apply();

		if (android.os.Build.VERSION.SDK_INT >= 23) {
			alarmManager.setExactAndAllowWhileIdle(android.app.AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
		} else if (android.os.Build.VERSION.SDK_INT >= 19) {
			alarmManager.setExact(android.app.AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
		} else {
			alarmManager.set(android.app.AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
		}

		console.log("⏳ App Iniciado: Serviço em background configurado para o primeiro disparo e auto-repetição automática a cada 10 minutos.");
	});
}

import * as application from "@nativescript/core/application";

//permitir usar sockets na tread principal
application.android.on('activityCreated', function activityCreated(args) {
	android.os.StrictMode.setThreadPolicy(new android.os.StrictMode.ThreadPolicy.Builder().permitAll().build())
})
