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

// Éléments DOM
document.addEventListener('DOMContentLoaded', function() {
    // Récupération des éléments du formulaire
    const tagTypeSelect = document.getElementById('tag-type');
    const tagNotesInput = document.getElementById('tag-notes');
    const addTagBtn = document.getElementById('add-tag-btn');
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

    // Définir "Aujourd'hui" comme filtre par défaut
document.addEventListener('DOMContentLoaded', function() {
    // Code existant...
    
    // Définir le filtre par défaut sur "Aujourd'hui"
    const dateFilterSelect = document.getElementById('date-filter');
    dateFilterSelect.value = 'today';
    // Déclencher l'événement change pour appliquer le filtre
    const event = new Event('change');
    dateFilterSelect.dispatchEvent(event);
    
    // Reste du code...
});
    
    // Initialisation des graphiques
    initCharts();
    
    // Chargement des tags du stockage local
    loadTags();
    
    // Événements des formulaires
    addTagBtn.addEventListener('click', addTag);
    
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
    
    // Initialisation des fonctions
    function loadTags() {
        const savedTags = localStorage.getItem('callTags');
        if (savedTags) {
            allTags = JSON.parse(savedTags);
        }
        filterTags();
    }
    
    function saveTags() {
        localStorage.setItem('callTags', JSON.stringify(allTags));
    }
    
    function addTag() {
        const type = tagTypeSelect.value;
        const notes = tagNotesInput.value;
        
        if (!type) return;
        
        const newTag = {
            id: Date.now(),
            type,
            date: new Date().toISOString(),
            notes
        };
        
        allTags.push(newTag);
        saveTags();
        filterTags();
        
        // Réinitialiser le formulaire
        tagTypeSelect.value = '';
        tagNotesInput.value = '';
    }
    
    function deleteTag(id) {
        allTags = allTags.filter(tag => tag.id !== id);
        saveTags();
        filterTags();
    }
    
    function filterTags() {
        const filter = dateFilterSelect.value;
        
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
        
        updateUI();
        updateCharts();
    }
    
    function updateUI() {
        // Mettre à jour les compteurs
        qaeCountElement.textContent = countTagsByType('QAE KO');
        qasCountElement.textContent = countTagsByType('QAS KO');
        injCountElement.textContent = countTagsByType('INJ');
        
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
    
    function countTagsByType(type) {
        return filteredTags.filter(tag => tag.type === type).length;
    }
    
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
    
    function exportData() {
        const dataStr = JSON.stringify(filteredTags, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `tags-appels-${new Date().toLocaleDateString('fr-FR')}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }
    
    function initCharts() {
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
    }
    
    function updateCharts() {
        // Mise à jour du graphique camembert
        const pieData = [
            countTagsByType('QAE KO'),
            countTagsByType('QAS KO'),
            countTagsByType('INJ')
        ];
        
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
        
        barChart.data.labels = sortedDates;
        barChart.data.datasets[0].data = sortedDates.map(date => tagsByDate[date]['QAE KO']);
        barChart.data.datasets[1].data = sortedDates.map(date => tagsByDate[date]['QAS KO']);
        barChart.data.datasets[2].data = sortedDates.map(date => tagsByDate[date]['INJ']);
        barChart.update();
    }
});
