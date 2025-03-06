```javascript
// Modèle de données pour les tags
let allTags = [];
let filteredTags = [];
let pieChart = null;
let barChart = null;

// Constantes
const TAG_TYPES = {
    'QAE KO': 'Qualité appel entrant KO',
    'QAS KO': 'Qualité appel sortant KO',
    'INJ': 'Client qui n\'arrive pas à nous joindre'
};

const COLORS = [
    '#3498db',  // Bleu pour QAE KO
    '#2ecc71',  // Vert pour QAS KO
    '#f39c12'   // Orange pour INJ
];

// Initialisation après chargement du DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM chargé, initialisation de l'application");
    
    // Récupération des éléments du formulaire
    const tagForm = document.getElementById('tag-form');
    const tagTypeSelect = document.getElementById('tag-type');
    const tagNotesInput = document.getElementById('tag-notes');
    const dateFilterSelect = document.getElementById('date-filter');
    const customDateContainer = document.getElementById('custom-date-container');
    const dateStartInput = document.getElementById('date-start');
    const dateEndInput = document.getElementById('date-end');
    
    // Récupération des éléments d'affichage
    const qaeCountElement = document.getElementById('qae-count');
    const qasCountElement = document.getElementById('qas-count');
    const injCountElement = document.getElementById('inj-count');
    const tagsTableContainer = document.getElementById('tags-table-container');
    const tagsBody = document.getElementById('tags-body');
    const tagCountElement = document.getElementById('tag-count');
    const noTagsMessage = document.getElementById('no-tags-message');
    const exportBtn = document.getElementById('export-btn');
    
    // Vérifier que tous les éléments sont trouvés
    console.log("Éléments du DOM récupérés", {
        tagForm, tagTypeSelect, tagNotesInput, dateFilterSelect,
        qaeCountElement, qasCountElement, injCountElement
    });
    
    // Initialisation des graphiques
    initCharts();
    
    // Chargement des tags du stockage local
    loadTags();
    
    // Définir "Aujourd'hui" comme filtre par défaut
    dateFilterSelect.value = 'today';
    filterTags(); // Appliquer le filtre immédiatement
    
    // Événements des formulaires
    tagForm.addEventListener('submit', function(e) {
        e.preventDefault(); // Empêcher le formulaire de se soumettre normalement
        addTag();
    });
    
    // Gestion de la touche Entrée dans le champ de notes
    tagNotesInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag();
        }
    });
    
    dateFilterSelect.addEventListener('change', () => {
        if (dateFilterSelect.value === 'custom') {
            customDateContainer.style.display = 'flex';
        } else {
            customDateContainer.style.display = 'none';
        }
        filterTags();
    });
    
    dateStartInput.addEventListener('change', filterTags);
    dateEndInput.addEventListener('change', filterTags);
    exportBtn.addEventListener('click', exportData);
    
    // Fonction pour ajouter un tag
    function addTag() {
        const type = tagTypeSelect.value;
        const notes = tagNotesInput.value;
        
        console.log("Tentative d'ajout d'un tag", { type, notes });
        
        if (!type) {
            alert("Veuillez sélectionner un type de tag");
            return;
        }
        
        const newTag = {
            id: Date.now(),
            type,
            date: new Date().toISOString(),
            notes
        };
        
        console.log("Nouveau tag créé", newTag);
        
        allTags.push(newTag);
        saveTags();
        filterTags();
        
        // Réinitialiser le formulaire
        tagTypeSelect.value = '';
        tagNotesInput.value = '';
        
        // Remettre le focus sur le select pour ajouter un autre tag rapidement
        tagTypeSelect.focus();
        
        console.log("Tag ajouté, nombre total:", allTags.length);
    }
    
    // Charger les tags du stockage local
    function loadTags() {
        const savedTags = localStorage.getItem('callTags');
        console.log("Chargement des tags depuis le stockage local");
        
        if (savedTags) {
            try {
                allTags = JSON.parse(savedTags);
                console.log("Tags chargés:", allTags.length);
            } catch (e) {
                console.error("Erreur lors du chargement des tags:", e);
                allTags = [];
            }
        } else {
            console.log("Aucun tag trouvé dans le stockage local");
            allTags = [];
        }
    }
    
    // Sauvegarder les tags dans le stockage local
    function saveTags() {
        localStorage.setItem('callTags', JSON.stringify(allTags));
        console.log("Tags sauvegardés dans le stockage local", allTags.length);
    }
    
    // Supprimer un tag
    function deleteTag(id) {
        console.log("Suppression du tag avec ID:", id);
        allTags = allTags.filter(tag => tag.id !== id);
        saveTags();
        filterTags();
    }
    
    // Filtrer les tags selon la période sélectionnée
    function filterTags() {
        const filter = dateFilterSelect.value;
        console.log("Filtrage des tags avec le filtre:", filter);
        
        if (filter === 'all') {
            filteredTags = [...allTags];
        } else {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (filter === 'today') {
                filteredTags = allTags.filter(tag => new Date(tag.date) >= today);
            } else if (filter === 'week') {
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - today.getDay());
                filteredTags = allTags.filter(tag => new Date(tag.date) >= startOfWeek);
            } else if (filter === 'month') {
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                filteredTags = allTags.filter(tag => new Date(tag.date) >= startOfMonth);
            } else if (filter === 'custom' && dateStartInput.value && dateEndInput.value) {
                const start = new Date(dateStartInput.value);
                const end = new Date(dateEndInput.value);
                end.setHours(23, 59, 59, 999);
                filteredTags = allTags.filter(tag => {
                    const tagDate = new Date(tag.date);
                    return tagDate >= start && tagDate <= end;
                });
            } else {
                filteredTags = [...allTags];
            }
        }
        
        console.log("Tags filtrés:", filteredTags.length);
        updateUI();
        updateCharts();
    }
    
    // Mettre à jour l'interface utilisateur
    function updateUI() {
        // Mettre à jour les compteurs
        const qaeCount = countTagsByType('QAE KO');
        const qasCount = countTagsByType('QAS KO');
        const injCount = countTagsByType('INJ');
        
        console.log("Mise à jour des compteurs", { qaeCount, qasCount, injCount });
        
        qaeCountElement.textContent = qaeCount;
        qasCountElement.textContent = qasCount;
        injCountElement.textContent = injCount;
        
        // Mettre à jour le tableau des tags
        tagsBody.innerHTML = '';
        tagCountElement.textContent = filteredTags.length;
        
        if (filteredTags.length > 0) {
            tagsTableContainer.style.display = 'table';
            noTagsMessage.style.display = 'none';
            
            // Trier les tags par date (plus récent en premier)
            const sortedTags = [...filteredTags].sort((a, b) => new Date(b.date) - new Date(a.date));
            
            sortedTags.forEach(tag => {
                const row = document.createElement('tr');
                
                // Cellule de date
                const dateCell = document.createElement('td');
                dateCell.textContent = formatDate(tag.date);
                row.appendChild(dateCell);
                
                // Cellule de type
                const typeCell = document.createElement('td');
                typeCell.textContent = tag.type;
                row.appendChild(typeCell);
                
                // Cellule de notes
                const notesCell = document.createElement('td');
                notesCell.textContent = tag.notes || '';
                row.appendChild(notesCell);
                
                // Cellule d'actions
                const actionsCell = document.createElement('td');
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Supprimer';
                deleteButton.className = 'btn delete-btn';
                deleteButton.onclick = () => deleteTag(tag.id);
                actionsCell.appendChild(deleteButton);
                row.appendChild(actionsCell);
                
                tagsBody.appendChild(row);
            });
        } else {
            tagsTableContainer.style.display = 'none';
            noTagsMessage.style.display = 'block';
        }
    }
    
    // Compter les tags par type
    function countTagsByType(type) {
        return filteredTags.filter(tag => tag.type === type).length;
    }
    
    // Formater la date pour l'affichage
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', { 
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    // Exporter les données
    function exportData() {
        const dataStr = JSON.stringify(filteredTags, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `tags-appels-${new Date().toLocaleDateString('fr-FR')}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }
    
    // Initialiser les graphiques
    function initCharts() {
        console.log("Initialisation des graphiques");
        
        try {
            // Graphique camembert (répartition par type)
            const pieCtx = document.getElementById('pie-chart').getContext('2d');
            pieChart = new Chart(pieCtx, {
                type: 'pie',
                data: {
                    labels: Object.keys(TAG_TYPES),
                    datasets: [{
                        data: [0, 0, 0],
                        backgroundColor: COLORS,
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                    return `${label}: ${value} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
            
            // Graphique à barres (évolution par jour)
            const barCtx = document.getElementById('bar-chart').getContext('2d');
            barChart = new Chart(barCtx, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'QAE KO',
                            data: [],
                            backgroundColor: COLORS[0],
                            borderWidth: 1
                        },
                        {
                            label: 'QAS KO',
                            data: [],
                            backgroundColor: COLORS[1],
                            borderWidth: 1
                        },
                        {
                            label: 'INJ',
                            data: [],
                            backgroundColor: COLORS[2],
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            stacked: false
                        },
                        y: {
                            stacked: false,
                            beginAtZero: true
                        }
                    }
                }
            });
            
            console.log("Graphiques initialisés avec succès");
        } catch (error) {
            console.error("Erreur lors de l'initialisation des graphiques:", error);
        }
    }
    
    // Mettre à jour les graphiques
    function updateCharts() {
        console.log("Mise à jour des graphiques");
        
        try {
            // Mise à jour du graphique camembert
            const pieData = [
                countTagsByType('QAE KO'),
                countTagsByType('QAS KO'),
                countTagsByType('INJ')
            ];
            
            console.log("Données pour le graphique camembert:", pieData);
            
            pieChart.data.datasets[0].data = pieData;
            pieChart.update();
            
            // Mise à jour du graphique à barres
            // Regrouper les tags par date
            const tagsByDate = {};
            
            filteredTags.forEach(tag => {
                const date = new Date(tag.date).toLocaleDateString('fr-FR');
                if (!tagsByDate[date]) {
                    tagsByDate[date] = {
                        'QAE KO': 0,
                        'QAS KO': 0,
                        'INJ': 0
                    };
                }
                tagsByDate[date][tag.type]++;
            });
            
            // Convertir en format pour le graphique
            const sortedDates = Object.keys(tagsByDate).sort((a, b) => {
                return new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-'));
            });
            
            console.log("Dates pour le graphique à barres:", sortedDates);
            
            barChart.data.labels = sortedDates;
            barChart.data.datasets[0].data = sortedDates.map(date => tagsByDate[date]['QAE KO']);
            barChart.data.datasets[1].data = sortedDates.map(date => tagsByDate[date]['QAS KO']);
            barChart.data.datasets[2].data = sortedDates.map(date => tagsByDate[date]['INJ']);
            barChart.update();
            
            console.log("Graphiques mis à jour avec succès");
        } catch (error) {
            console.error("Erreur lors de la mise à jour des graphiques:", error);
        }
    }
});
```
