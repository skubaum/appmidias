import { Application, Connectivity } from '@nativescript/core';

export class ConectionUtils {
    static buscarIp() {
        if (this.isWifi()) {
            const mng = Application.android.getNativeApplication().getApplicationContext().getSystemService(android.content.Context.WIFI_SERVICE);
            const ipAddressInt = mng.getConnectionInfo().getIpAddress();
            const ipAddress = (
                (ipAddressInt & 0xFF) +
                '.' +
                ((ipAddressInt >> 8) & 0xFF) +
                '.' +
                ((ipAddressInt >> 16) & 0xFF) +
                '.' +
                ((ipAddressInt >> 24) & 0xFF)
            );
            return ipAddress;
        } else {
            return "192.168.101.165";
        }
    }

    static isWifi() {
        return Connectivity.getConnectionType() == 1;
    }
}