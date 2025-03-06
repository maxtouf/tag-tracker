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
    const tagForm = document.querySelector('form') || document.createElement('form');
    const tagTypeSelect = document.getElementById('tag-type') || document.querySelector('select');
    const tagNotesInput = document.getElementById('tag-notes') || document.querySelector('input[type="text"]');
    const addButton = document.querySelector('button');
    const dateFilterSelect = document.getElementById('date-filter') || document.querySelectorAll('select')[1];
    
    // Récupération des éléments d'affichage
    const qaeCountElement = document.querySelector('#qae-count') || document.querySelectorAll('h3 + p + p')[0];
    const qasCountElement = document.querySelector('#qas-count') || document.querySelectorAll('h3 + p + p')[1];
    const injCountElement = document.querySelector('#inj-count') || document.querySelectorAll('h3 + p + p')[2];
    const tagCountElement = document.querySelector('.liste-tags-count') || document.querySelector('h2 span');
    const tagsTableBody = document.querySelector('#tags-body') || document.querySelector('table tbody');
    
    console.log("Éléments récupérés:", {
        tagTypeSelect, tagNotesInput, addButton, dateFilterSelect,
        qaeCountElement, qasCountElement, injCountElement, tagCountElement, tagsTableBody
    });
    
    // Charger Chart.js s'il n'est pas déjà chargé
    if (typeof Chart === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = function() {
            console.log("Chart.js chargé avec succès");
            initCharts();
            loadTags();
        };
        document.head.appendChild(script);
    } else {
        initCharts();
        loadTags();
    }
    
    // Ajouter un événement au formulaire ou au bouton
    if (addButton) {
        addButton.addEventListener('click', function(e) {
            e.preventDefault();
            addTag();
        });
    }
    
    // Filtrage par date (si le sélecteur existe)
    if (dateFilterSelect) {
        dateFilterSelect.addEventListener('change', filterTags);
    }
    
    // Initialiser les graphiques
    function initCharts() {
        try {
            console.log("Initialisation des graphiques");
            
            // Graphique camembert (répartition par type)
            const pieCanvas = document.getElementById('pie-chart');
            if (pieCanvas) {
                const pieCtx = pieCanvas.getContext('2d');
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
            } else {
                console.log("Canvas pour le graphique camembert non trouvé, création...");
                createPieChartCanvas();
            }
            
            // Graphique à barres (évolution par jour)
            const barCanvas = document.getElementById('bar-chart');
            if (barCanvas) {
                const barCtx = barCanvas.getContext('2d');
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
            } else {
                console.log("Canvas pour le graphique à barres non trouvé, création...");
                createBarChartCanvas();
            }
            
            console.log("Graphiques initialisés avec succès");
        } catch (error) {
            console.error("Erreur lors de l'initialisation des graphiques:", error);
        }
    }
    
    // Créer le canvas pour le graphique camembert si nécessaire
    function createPieChartCanvas() {
        const pieChartContainer = document.querySelector('.chart-container') || 
                                 document.querySelector('[id^="repartition"]') || 
                                 document.querySelectorAll('.chart-card')[0] ||
                                 document.querySelectorAll('.card')[3];
        
        if (pieChartContainer) {
            const canvas = document.createElement('canvas');
            canvas.id = 'pie-chart';
            canvas.style.width = '100%';
            canvas.style.height = '300px';
            pieChartContainer.appendChild(canvas);
            
            // Réinitialiser le graphique
            setTimeout(() => {
                initCharts();
            }, 100);
        }
    }
    
    // Créer le canvas pour le graphique à barres si nécessaire
    function createBarChartCanvas() {
        const barChartContainer = document.querySelector('.chart-container:nth-child(2)') || 
                                 document.querySelector('[id^="evolution"]') || 
                                 document.querySelectorAll('.chart-card')[1] ||
                                 document.querySelectorAll('.card')[4];
        
        if (barChartContainer) {
            const canvas = document.createElement('canvas');
            canvas.id = 'bar-chart';
            canvas.style.width = '100%';
            canvas.style.height = '300px';
            barChartContainer.appendChild(canvas);
            
            // Réinitialiser le graphique
            setTimeout(() => {
                initCharts();
            }, 100);
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
        allTags = allTags.filter(tag => tag.id !== id);
        saveTags();
        filterTags();
    }
    
    // Filtrer les tags selon la période sélectionnée
    function filterTags() {
        if (!dateFilterSelect) {
            filteredTags = [...allTags];
            updateUI();
            return;
        }
        
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
        
        if (qaeCountElement) qaeCountElement.textContent = qaeCount;
        if (qasCountElement) qasCountElement.textContent = qasCount;
        if (injCountElement) injCountElement.textContent = injCount;
        
        // Mettre à jour le compteur dans le titre de la liste
        if (tagCountElement) {
            tagCountElement.textContent = `(${filteredTags.length})`;
        } else {
            // Trouver le titre de la liste des tags et ajuster le compteur
            const listeTitles = document.querySelectorAll('h2');
            listeTitles.forEach(title => {
                if (title.textContent.includes('Liste des tags')) {
                    if (title.querySelector('span')) {
                        title.querySelector('span').textContent = `(${filteredTags.length})`;
                    } else {
                        title.textContent = `Liste des tags (${filteredTags.length})`;
                    }
                }
            });
        }
        
        // Mettre à jour la table des tags
        updateTagsTable();
    }
    
    // Mettre à jour la table des tags
    function updateTagsTable() {
        if (!tagsTableBody) {
            console.warn("Corps de table non trouvé");
            return;
        }
        
        // Vider la table
        tagsTableBody.innerHTML = '';
        
        // Si aucun tag filtré, afficher un message
        if (filteredTags.length === 0) {
            const emptyRow = document.createElement('tr');
            const emptyCell = document.createElement('td');
            emptyCell.colSpan = 4;
            emptyCell.textContent = 'Aucun tag pour la période sélectionnée';
            emptyCell.style.textAlign = 'center';
            emptyCell.style.padding = '20px';
            emptyCell.style.fontStyle = 'italic';
            emptyRow.appendChild(emptyCell);
            tagsTableBody.appendChild(emptyRow);
            return;
        }
        
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
            deleteButton.className = 'btn delete-btn';
            deleteButton.style.color = '#e74c3c';
            deleteButton.style.background = 'none';
            deleteButton.style.border = 'none';
            deleteButton.style.cursor = 'pointer';
            deleteButton.onclick = () => deleteTag(tag.id);
            actionsCell.appendChild(deleteButton);
            row.appendChild(actionsCell);
            
            tagsTableBody.appendChild(row);
        });
    }
    
    // Mettre à jour les graphiques
    function updateCharts() {
        if (!pieChart || !barChart) {
            console.warn("Graphiques non initialisés");
            return;
        }
        
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
});
