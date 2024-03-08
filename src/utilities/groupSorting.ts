export function groupSorting(group: object[]){
    return combineSortedGroups(sortGroupsByScore(groupByIntent(group)));
}

// Metodo per raggruppare gli oggetti in base all'attributo "intent"
function groupByIntent(data) {
    return data.reduce((accumulator, currentValue) => {
        const key = currentValue['intent'];
        if (!accumulator[key]) {
            accumulator[key] = [];
        }
        accumulator[key].push(currentValue);
        return accumulator;
    }, {});
}

// Metodo per ordinare ciascun gruppo in base all'attributo "score" in ordine decrescente
function sortGroupsByScore(groups) {
    Object.keys(groups).forEach((key) => {
        groups[key].sort((a, b) => b.score - a.score);
    });
    return groups;
}

// Metodo per combinare tutti i gruppi ordinati in un singolo array
function combineSortedGroups(sortedGroups) {
    return Object.values(sortedGroups).flat();
}