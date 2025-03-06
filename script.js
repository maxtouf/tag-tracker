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
    const addTagBtn = document.getElementById('add-tag-btn');
    const dateFilterSelect = document.getElementById('date-filter');
    const customDateContainer = document.getElementById('custom-date-container');
    const dateStartInput = document.getElementById('date-start');
    const dateEndInput = document.getElementById('date-end');
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const importFileInput = document.getElementById('import-file');
    
    // Récupération des éléments d'affichage
    const qaeCountElement = document.getElementById('qae-count');
    const qasCountElement = document.getElementById('qas-count');
    const injCountElement = document.getElementById('inj-count');
    const tagCountElement = document.querySelector('.liste-tags-count');
    const tagsTableBody = document.getElementById('tags-body');
    const noTagsMessage = document.getElementById('no-tags-message');
    
    console.log("Éléments récupérés");
    
    // Initialiser les graphiques
    initCharts();
    
    // Charger les tags du stockage local
    loadTags();
    
    // Ajouter un événement au formulaire
    if (tagForm) {
        tagForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addTag();
        });
    }
    
    // Ajouter un événement au bouton ajouter (au cas où)
    if (addTagBtn) {
        addTagBtn.addEventListener('click', function(e) {
            e.preventDefault();
            addTag();
        });
    }
    
    // Gestion de la touche Entrée dans le champ de notes
    if (tagNotesInput) {
        tagNotesInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
            }
        });
    }
    
    // Filtrage par date
    if (dateFilterSelect) {
        dateFilterSelect.addEventListener('change', function() {
            if (dateFilterSelect.value === 'custom') {
                customDateContainer.style.display = 'flex';
            } else {
                customDateContainer.style.display = 'none';
            }
            filterTags();
        });
    }
    
    if (dateStartInput) {
        dateStartInput.addEventListener('change', filterTags);
    }
    
    if (dateEndInput) {
        dateEndInput.addEventListener('change', filterTags);
    }
    
    // Exportation/Importation
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }
    
    if (importBtn && importFileInput) {
        importBtn.addEventListener('click', function() {
            importFileInput.click();
        });
        
        importFileInput.addEventListener('change', importData);
    }
    
    // Fonction pour initialiser les graphiques
    function initCharts() {
        try {
            console.log("Initialisation des graphiques");
            
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
        
        filterTags();
    }
    
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
        tagTypeSelect.focus();
        
        console.log("Tag ajouté, nombre total:", allTags.length);
    }
    
    // Sauvegarder les tags dans le stockage local
    function saveTags() {
        localStorage.setItem('callTags', JSON.stringify(allTags));
        console.log("Tags sauvegardés dans le stockage local", allTags.length);
    }
    
    // Supprimer un tag
    function deleteTag(id) {
        console.log("Suppression du tag avec ID:", id);
        
        if (confirm("Êtes-vous sûr de vouloir supprimer ce tag ?")) {
            allTags = allTags.filter(tag => tag.id !== id);
            saveTags();
            filterTags();
        }
    }
    
    // Filtrer les tags selon la période sélectionnée
    function filterTags() {
        const filter = dateFilterSelect.value;
        console.log("Filtrage des tags avec le filtre:", filter);
        
        if (filter === 'all' || filter === 'Toutes les périodes') {
            filteredTags = [...allTags];
        } else {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (filter === 'today' || filter === 'Aujourd\'hui') {
                filteredTags = allTags.filter(tag => new Date(tag.date) >= today);
            } else if (filter === 'week' || filter === 'Cette semaine') {
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - today.getDay());
                filteredTags = allTags.filter(tag => new Date(tag.date) >= startOfWeek);
            } else if (filter === 'month' || filter === 'Ce mois') {
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                filteredTags = allTags.filter(tag => new Date(tag.date) >= startOfMonth);
            } else if (filter === 'custom' || filter === 'Période personnalisée') {
                if (dateStartInput.value && dateEndInput.value) {
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
        
        // Mettre à jour le compteur dans le titre de la liste
        tagCountElement.textContent = filteredTags.length;
        
        // Mettre à jour la table des tags
        updateTagsTable();
    }
    
    // Mettre à jour la table des tags
    function updateTagsTable() {
        // Vider la table
        tagsTableBody.innerHTML = '';
        
        // Si aucun tag filtré, afficher un message
        if (filteredTags.length === 0) {
            noTagsMessage.style.display = 'block';
            return;
        }
        
        noTagsMessage.style.display = 'none';
        
        // Trier les tags par date (plus récent en premier)
        const sortedTags = [...filteredTags].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Ajouter chaque tag à la table
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
            deleteButton.className = 'delete-btn';
            deleteButton.onclick = () => deleteTag(tag.id);
            actionsCell.appendChild(deleteButton);
            row.appendChild(actionsCell);
            
            tagsTableBody.appendChild(row);
        });
    }
    
    // Mettre à jour les graphiques
    function updateCharts() {
        try {
            // Mise à jour du graphique camembert
            const pieData = [
                countTagsByType('QAE KO'),
                countTagsByType('QAS KO'),
                countTagsByType('INJ')
            ];
            
            pieChart.data.datasets[0].data = pieData;
            pieChart.update();
            
            // Mise à jour du graphique à barres
            updateBarChart();
            
        } catch (error) {
            console.error("Erreur lors de la mise à jour des graphiques:", error);
        }
    }
    
    // Mettre à jour le graphique à barres
    function updateBarChart() {
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
            const partsA = a.split('/');
            const partsB = b.split('/');
            return new Date(`${partsA[2]}-${partsA[1]}-${partsA[0]}`) - new Date(`${partsB[2]}-${partsB[1]}-${partsB[0]}`);
        });
        
        barChart.data.labels = sortedDates;
        barChart.data.datasets[0].data = sortedDates.map(date => tagsByDate[date]['QAE KO']);
        barChart.data.datasets[1].data = sortedDates.map(date => tagsByDate[date]['QAS KO']);
        barChart.data.datasets[2].data = sortedDates.map(date => tagsByDate[date]['INJ']);
        barChart.update();
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
    
    // Exporter les données en JSON
    function exportData() {
        const dataStr = JSON.stringify(allTags, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `tags-appels-${new Date().toLocaleDateString('fr-FR')}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }
    
    // Importer des données
    function importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedTags = JSON.parse(e.target.result);
                
                // Vérifier si les données sont valides
                if (!Array.isArray(importedTags)) {
                    throw new Error("Format de données invalide");
                }
                
                // Fusionner avec les tags existants (éviter les doublons par ID)
                const existingIds = allTags.map(tag => tag.id);
                const newTags = importedTags.filter(tag => !existingIds.includes(tag.id));
                
                allTags = [...allTags, ...newTags];
                saveTags();
                filterTags();
                
                alert(`${newTags.length} tags importés avec succès.`);
            } catch (error) {
                console.error("Erreur lors de l'importation:", error);
                alert("Erreur lors de l'importation du fichier. Assurez-vous qu'il s'agit d'un fichier JSON valide.");
            }
            
            // Réinitialiser le champ de fichier
            importFileInput.value = '';
        };
        reader.readAsText(file);
    }
});
