import { Application, ApplicationSettings } from '@nativescript/core';

export class Utils {
    static nuloOuVazio(param) {
        if (param == null) {
            return true;
        }
        if (typeof param.trim == 'function') {
            return param.trim() == '';
        }
        return param == '';
    }

    static formatarBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024)); // Determina a unidade apropriada
        
        const value = (bytes / Math.pow(1024, i)).toFixed(2); // Converte o valor com duas casas decimais
        
        return `${value} ${sizes[i]}`; // Retorna o valor formatado 
    }

    static getDeviceId() {
        let deviceId;
        try {
            if (global.isAndroid) {
                const androidId = android.provider.Settings.Secure.getString(
                    Application.android.context.getContentResolver(),
                    android.provider.Settings.Secure.ANDROID_ID
                );
                deviceId = androidId; // ANDROID_ID é único para o dispositivo
            } else if (global.isIOS) {
                deviceId = UIDevice.currentDevice.identifierForVendor.UUIDString;
            }
        } catch (ex) {
            console.log("Utils.getDeviceId: ", ex);
        }

        return deviceId;
    }

    static getDeviceId1() {
        let deviceId;
        try {
            deviceId = ApplicationSettings.getString("device_id", null);
        
            if (!deviceId) {
                // deviceId = NativescriptUtils.UUID.randomUUID(); // Gera um novo UUID
                ApplicationSettings.setString("device_id", deviceId); // Salva o ID no armazenamento local
            }
        } catch (ex) {
            console.log("Utils.getDeviceId: ", ex);
        }

        return deviceId;
    }

    static fixJSON(badJSON) {

        // Replace ":" with "@colon@" if it's between double-quotes
        badJSON = badJSON.replace(/:\s*"([^"]*)"/g, function(match, p1) {
            return ': "' + p1.replace(/:/g, '@colon@') + '"';
        });
    
        // Replace ":" with "@colon@" if it's between single-quotes
        badJSON = badJSON.replace(/:\s*'([^']*)'/g, function(match, p1) {
            return ': "' + p1.replace(/:/g, '@colon@') + '"';
        });
    
        // Add double-quotes around any tokens before the remaining ":"
        badJSON = badJSON.replace(/(['"])?([a-z0-9A-Z_]+)(['"])?\s*:/g, '"$2": ');
    
        // Turn "@colon@" back into ":"
        badJSON = badJSON.replace(/@colon@/g, ':');
    
      return badJSON;
    }
}