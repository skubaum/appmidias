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

    static burcarEnderecoServidor() {
        let ftpIp = "192.168.101.165";
        const ip = this.buscarIp();
        if (!ip.startsWith("192.168.101")) {
            ftpIp = "192.168.0.146";
        }
        return ftpIp;
    }

    static servidorOnline() {
        try {
            const host = ConectionUtils.burcarEnderecoServidor();
            const timeout = 3000; // 5 segundos
            const socket = new java.net.Socket();
            const socketAddress = new java.net.InetSocketAddress(host, 21);
            socket.connect(socketAddress, timeout);
            socket.close();
            return true;
        } catch (err) {
            console.log(err);
            console.log("❌ Porta não está acessível:", err);
            return false;
        }
    }

    static isWifi() {
        return Connectivity.getConnectionType() == 1;
    }
}