export function quoteSpaces(path: string): string {
    // Controlla se la path contiene spazi
    if (path.includes(" ")) {
        // Aggiunge doppie virgolette alla path per gestire gli spazi in Windows
        return '"' + path + '"';
    } else {
        return path;
    }
}