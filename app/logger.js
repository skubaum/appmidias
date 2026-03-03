import { knownFolders, File } from '@nativescript/core';

export class Logger {
    static getLogFile() {
        const folder = knownFolders.documents();
        return folder.getFile("audit_logs.json");
    }

    static getLogs() {
        const file = this.getLogFile();
        try {
            const content = file.readTextSync();
            if (content) {
                return JSON.parse(content);
            }
        } catch (e) {
            console.log("Erro ao ler logs de auditoria:", e);
        }
        return [];
    }

    static log(message) {
        try {
            const logs = this.getLogs();

            // Format current date and time
            const now = new Date();
            const d = String(now.getDate()).padStart(2, '0');
            const m = String(now.getMonth() + 1).padStart(2, '0');
            const y = now.getFullYear();
            const h = String(now.getHours()).padStart(2, '0');
            const min = String(now.getMinutes()).padStart(2, '0');
            const s = String(now.getSeconds()).padStart(2, '0');
            const timestamp = `${d}/${m}/${y} ${h}:${min}:${s}`;

            const logEntry = {
                timestamp: timestamp,
                message: message
            };

            // Add to the beginning of the array so newest is first
            logs.unshift(logEntry);

            // Maintain a reasonable limit, e.g., last 1000 logs
            if (logs.length > 1000) {
                logs.pop();
            }

            const file = this.getLogFile();
            file.writeTextSync(JSON.stringify(logs, null, 2));

            console.log(`[AUDIT] ${timestamp} - ${message}`);
        } catch (e) {
            console.log("Erro ao salvar log de auditoria:", e);
        }
    }

    static clearLogs() {
        try {
            const file = this.getLogFile();
            file.writeTextSync("[]");
        } catch (e) {
            console.log("Erro ao limpar logs:", e);
        }
    }
}
