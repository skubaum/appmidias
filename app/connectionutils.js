import { Application, Connectivity } from '@nativescript/core';

export class ConectionUtils {
    static buscarIp() {
        if (this.isWifi()) {
            try {
                const en = java.net.NetworkInterface.getNetworkInterfaces();
                let lastIp = null;
                while (en.hasMoreElements()) {
                    const intf = en.nextElement();
                    const enumIpAddr = intf.getInetAddresses();
                    while (enumIpAddr.hasMoreElements()) {
                        const inetAddress = enumIpAddr.nextElement();
                        if (!inetAddress.isLoopbackAddress() && (inetAddress instanceof java.net.Inet4Address)) {
                            const ip = inetAddress.getHostAddress();
                            lastIp = ip;
                            if (ip.startsWith("192.168.")) {
                                return ip;
                            }
                        }
                    }
                }
                if (lastIp) return lastIp;
            } catch (ex) {
                console.log("Erro NetworkInterface: ", ex);
            }

            try {
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
            } catch (e) {
                console.log("Erro WIFI_SERVICE: ", e);
            }
        }
        return "192.168.101.165";
    }

    static burcarEnderecoServidor() {
        let ftpIp = "192.168.101.165";
        const ip = this.buscarIp();
        if (!ip.startsWith("192.168.101")) {
            ftpIp = "192.168.0.146";
        }
        return ftpIp;
    }

    static servidorOnlineAsync(hostParam) {
        return new Promise((resolve) => {
            const host = hostParam || ConectionUtils.burcarEnderecoServidor();
            const timeout = 3000; // 3 segundos
            console.log("Teste de conexão para FTP em: " + host);
            const runnable = new java.lang.Runnable({
                run: function () {
                    let online = false;
                    try {
                        const socket = new java.net.Socket();
                        const socketAddress = new java.net.InetSocketAddress(host, 21);
                        socket.connect(socketAddress, timeout);
                        socket.close();
                        online = true;
                        console.log("✅ Conexão bem sucedida com: " + host);
                    } catch (err) {
                        console.log("❌ Erro de socket (" + host + "): " + err);
                        online = false;
                    }
                    new android.os.Handler(android.os.Looper.getMainLooper()).post(new java.lang.Runnable({
                        run: function () {
                            resolve(online);
                        }
                    }));
                }
            });
            new java.lang.Thread(runnable).start();
        });
    }

    static isWifi() {
        return Connectivity.getConnectionType() == 1;
    }
}