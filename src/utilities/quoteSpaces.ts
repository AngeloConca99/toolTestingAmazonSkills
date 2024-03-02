import os from 'os';

export function quoteSpaces(path: string): string {
    switch (os.platform()) {
        case "win32":
            return quoteSpacesWindows(path);
        case "linux":
            return quoteSpacesLinux(path);
        default:
            return path;
    }
    
}

function quoteSpacesWindows(path: string): string {
    // Controlla se la path contiene spazi
    if (path.includes(" ")) {
        // Aggiunge doppie virgolette alla path per gestire gli spazi in Windows
        return '"' + path + '"';
    } else {
        return path;
    }
}

function quoteSpacesLinux(path: string): string {
    // Controlla se la path contiene spazi
    if (path.includes(" ")) {
        // Aggiunge backslash alla path per gestire gli spazi in Linux
        return path.replace(/ /g, "\\ ");
    } else {
        return path;
    }
}
