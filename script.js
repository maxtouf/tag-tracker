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

            // Ajoutez ce code à votre fichier script.js

// Fonction pour créer un canvas personnalisé
function createCustomCanvas() {
  // Créer un conteneur pour le canvas
  const canvasContainer = document.createElement('div');
  canvasContainer.className = 'card';
  canvasContainer.style.marginBottom = '20px';
  
  // Ajouter un titre
  const title = document.createElement('h2');
  title.textContent = 'Visualisation personnalisée';
  canvasContainer.appendChild(title);
  
  // Créer le canvas
  const canvas = document.createElement('canvas');
  canvas.id = 'custom-canvas';
  canvas.width = 800;
  canvas.height = 400;
  canvas.style.width = '100%';
  canvas.style.height = 'auto';
  canvas.style.border = '1px solid #ddd';
  canvas.style.borderRadius = '4px';
  canvasContainer.appendChild(canvas);
  
  // Ajouter des contrôles
  const controls = document.createElement('div');
  controls.className = 'form-row';
  controls.style.marginTop = '10px';
  
  // Sélecteur de visualisation
  const selectGroup = document.createElement('div');
  selectGroup.className = 'form-group';
  
  const selectLabel = document.createElement('label');
  selectLabel.textContent = 'Type de visualisation';
  selectGroup.appendChild(selectLabel);
  
  const select = document.createElement('select');
  select.id = 'viz-type';
  
  const options = [
    { value: 'bubble', text: 'Diagramme à bulles' },
    { value: 'timeline', text: 'Chronologie' },
    { value: 'heatmap', text: 'Carte de chaleur (heures/jours)' }
  ];
  
  options.forEach(opt => {
    const option = document.createElement('option');
    option.value = opt.value;
    option.textContent = opt.text;
    select.appendChild(option);
  });
  
  selectGroup.appendChild(select);
  controls.appendChild(selectGroup);
  
  // Bouton pour redessiner
  const buttonGroup = document.createElement('div');
  buttonGroup.className = 'form-group';
  buttonGroup.style.display = 'flex';
  buttonGroup.style.alignItems = 'flex-end';
  
  const drawButton = document.createElement('button');
  drawButton.className = 'btn primary-btn';
  drawButton.textContent = 'Redessiner';
  drawButton.onclick = function() {
    drawCustomVisualization(select.value);
  };
  
  buttonGroup.appendChild(drawButton);
  controls.appendChild(buttonGroup);
  
  canvasContainer.appendChild(controls);
  
  // Insérer le canvas dans le DOM (avant le dernier élément)
  const container = document.querySelector('.container');
  container.insertBefore(canvasContainer, container.lastElementChild);
  
  // Dessiner la visualisation initiale
  setTimeout(() => {
    drawCustomVisualization('bubble');
  }, 500);
  
  return canvas;
}

// Fonction pour dessiner la visualisation personnalisée
function drawCustomVisualization(type) {
  const canvas = document.getElementById('custom-canvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Styles de base
  const colors = {
    'QAE KO': '#3498db',  // Bleu
    'QAS KO': '#2ecc71',  // Vert
    'INJ': '#f39c12'      // Orange
  };
  
  // Obtenir les données
  const data = filteredTags || allTags || [];
  
  if (data.length === 0) {
    // Afficher un message si aucune donnée
    ctx.fillStyle = '#7f8c8d';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Aucune donnée disponible pour cette période', canvas.width / 2, canvas.height / 2);
    return;
  }
  
  // Dessiner selon le type sélectionné
  switch (type) {
    case 'bubble':
      drawBubbleChart(ctx, data, colors, canvas.width, canvas.height);
      break;
    case 'timeline':
      drawTimeline(ctx, data, colors, canvas.width, canvas.height);
      break;
    case 'heatmap':
      drawHeatmap(ctx, data, colors, canvas.width, canvas.height);
      break;
  }
}

// Dessiner un diagramme à bulles
function drawBubbleChart(ctx, data, colors, width, height) {
  // Regrouper par type
  const groupedByType = {};
  
  data.forEach(tag => {
    if (!groupedByType[tag.type]) {
      groupedByType[tag.type] = 0;
    }
    groupedByType[tag.type]++;
  });
  
  const padding = 50;
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) / 3;
  
  // Dessiner le titre
  ctx.fillStyle = '#2c3e50';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Répartition des tags par type', centerX, padding / 2);
  
  // Calculer le rayon max en fonction du nombre max de tags
  const maxCount = Math.max(...Object.values(groupedByType));
  
  // Positions des bulles
  const positions = [
    { x: centerX - maxRadius/2, y: centerY },
    { x: centerX + maxRadius/2, y: centerY },
    { x: centerX, y: centerY + maxRadius/2 }
  ];
  
  // Dessiner les bulles
  let i = 0;
  for (const type in groupedByType) {
    if (groupedByType.hasOwnProperty(type)) {
      const count = groupedByType[type];
      const radius = (count / maxCount) * maxRadius / 2 + maxRadius / 4;
      
      // Dessiner le cercle
      ctx.beginPath();
      ctx.arc(positions[i].x, positions[i].y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = colors[type] + '80';  // Ajouter transparence
      ctx.fill();
      ctx.strokeStyle = colors[type];
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Dessiner le texte
      ctx.fillStyle = '#2c3e50';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(type, positions[i].x, positions[i].y - 5);
      ctx.font = '20px sans-serif';
      ctx.fillText(count, positions[i].x, positions[i].y + 20);
      
      i++;
    }
  }
  
  // Dessiner la légende
  const legendY = height - padding / 2;
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('La taille des bulles représente le nombre de tags', centerX, legendY);
}

// Dessiner une chronologie
function drawTimeline(ctx, data, colors, width, height) {
  // Trier les données par date
  const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  const padding = 50;
  const timelineY = height / 2;
  const timelineWidth = width - 2 * padding;
  
  // Obtenir la date min et max
  const dateMin = new Date(sortedData[0].date);
  const dateMax = new Date(sortedData[sortedData.length - 1].date);
  const totalDays = Math.ceil((dateMax - dateMin) / (1000 * 60 * 60 * 24)) + 1;
  
  // Dessiner le titre
  ctx.fillStyle = '#2c3e50';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Chronologie des tags', width / 2, padding / 2);
  
  // Dessiner la ligne de temps
  ctx.beginPath();
  ctx.moveTo(padding, timelineY);
  ctx.lineTo(width - padding, timelineY);
  ctx.strokeStyle = '#95a5a6';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Dessiner les graduations et dates
  const markCount = Math.min(totalDays, 10);
  const markSpace = timelineWidth / markCount;
  
  ctx.textAlign = 'center';
  ctx.fillStyle = '#7f8c8d';
  ctx.font = '12px sans-serif';
  
  for (let i = 0; i <= markCount; i++) {
    const x = padding + i * markSpace;
    
    // Graduation
    ctx.beginPath();
    ctx.moveTo(x, timelineY - 5);
    ctx.lineTo(x, timelineY + 5);
    ctx.stroke();
    
    // Date
    if (i % 2 === 0 || markCount <= 5) {
      const date = new Date(dateMin);
      date.setDate(date.getDate() + Math.floor(i * totalDays / markCount));
      ctx.fillText(date.toLocaleDateString('fr-FR'), x, timelineY + 20);
    }
  }
  
  // Dessiner les points de données
  const getXPosition = (date) => {
    const days = (new Date(date) - dateMin) / (1000 * 60 * 60 * 24);
    return padding + (days / totalDays) * timelineWidth;
  };
  
  // Regrouper les événements par jour et type
  const eventsByDay = {};
  
  sortedData.forEach(tag => {
    const dateStr = new Date(tag.date).toLocaleDateString('fr-FR');
    if (!eventsByDay[dateStr]) {
      eventsByDay[dateStr] = {
        'QAE KO': 0,
        'QAS KO': 0,
        'INJ': 0,
        date: new Date(tag.date)
      };
    }
    eventsByDay[dateStr][tag.type]++;
  });
  
  // Dessiner les points sur la timeline
  Object.values(eventsByDay).forEach(dayData => {
    const x = getXPosition(dayData.date);
    let offsetY = 0;
    
    for (const type in colors) {
      if (dayData[type] > 0) {
        // Dessiner un cercle
        const count = dayData[type];
        const radius = Math.min(Math.max(count * 3, 5), 15);
        
        ctx.beginPath();
        ctx.arc(x, timelineY - 15 - offsetY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = colors[type] + '80';
        ctx.fill();
        ctx.strokeStyle = colors[type];
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Ajouter le nombre
        ctx.fillStyle = '#2c3e50';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(count, x, timelineY - 15 - offsetY + 3);
        
        offsetY += radius * 2 + 5;
      }
    }
    
    // Ligne de connexion
    ctx.beginPath();
    ctx.moveTo(x, timelineY - 5);
    ctx.lineTo(x, timelineY - 15);
    ctx.strokeStyle = '#95a5a6';
    ctx.stroke();
  });
  
  // Légende
  const legendY = height - padding / 2;
  ctx.font = '12px sans-serif';
  
  let legendX = width / 4;
  for (const type in colors) {
    // Carré de couleur
    ctx.fillStyle = colors[type];
    ctx.fillRect(legendX - 40, legendY - 8, 12, 12);
    
    // Texte
    ctx.fillStyle = '#2c3e50';
    ctx.textAlign = 'left';
    ctx.fillText(type, legendX - 25, legendY);
    
    legendX += width / 4;
  }
}

// Dessiner une carte de chaleur
function drawHeatmap(ctx, data, colors, width, height) {
  const padding = 60;
  const heatmapWidth = width - 2 * padding;
  const heatmapHeight = height - 2 * padding;
  
  // Définir les dimensions de la grille
  const daysOfWeek = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const hoursOfDay = Array.from({ length: 24 }, (_, i) => `${i}h`);
  
  const cellWidth = heatmapWidth / hoursOfDay.length;
  const cellHeight = heatmapHeight / daysOfWeek.length;
  
  // Dessiner le titre
  ctx.fillStyle = '#2c3e50';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Répartition des tags par heure et jour de la semaine', width / 2, padding / 2);
  
  // Préparer les données pour la heatmap
  const heatmapData = {};
  
  daysOfWeek.forEach((day, dayIndex) => {
    heatmapData[dayIndex] = {};
    hoursOfDay.forEach((_, hourIndex) => {
      heatmapData[dayIndex][hourIndex] = {
        'QAE KO': 0,
        'QAS KO': 0,
        'INJ': 0,
        total: 0
      };
    });
  });
  
  // Remplir les données
  data.forEach(tag => {
    const date = new Date(tag.date);
    const day = date.getDay();
    const hour = date.getHours();
    
    heatmapData[day][hour][tag.type]++;
    heatmapData[day][hour].total++;
  });
  
  // Trouver la valeur maximale pour l'échelle de couleur
  let maxValue = 0;
  Object.values(heatmapData).forEach(dayData => {
    Object.values(dayData).forEach(hourData => {
      maxValue = Math.max(maxValue, hourData.total);
    });
  });
  
  // Dessiner la grille et les cellules
  for (let day = 0; day < daysOfWeek.length; day++) {
    for (let hour = 0; hour < hoursOfDay.length; hour++) {
      const x = padding + hour * cellWidth;
      const y = padding + day * cellHeight;
      
      // Dessiner la cellule
      const cellData = heatmapData[day][hour];
      const intensity = maxValue > 0 ? cellData.total / maxValue : 0;
      
      // Choisir la couleur principale
      let cellColor = '#f1f1f1';  // Couleur par défaut (gris clair)
      
      if (cellData.total > 0) {
        // Trouver le type le plus fréquent
        const maxType = Object.keys(colors).reduce((a, b) => 
          cellData[a] > cellData[b] ? a : b
        );
        
        // Mélanger avec le blanc selon l'intensité
        const baseColor = colors[maxType];
        const r = parseInt(baseColor.slice(1, 3), 16);
        const g = parseInt(baseColor.slice(3, 5), 16);
        const b = parseInt(baseColor.slice(5, 7), 16);
        
        const blendR = Math.floor(r * intensity + 241 * (1 - intensity));
        const blendG = Math.floor(g * intensity + 241 * (1 - intensity));
        const blendB = Math.floor(b * intensity + 241 * (1 - intensity));
        
        cellColor = `rgb(${blendR}, ${blendG}, ${blendB})`;
      }
      
      ctx.fillStyle = cellColor;
      ctx.fillRect(x, y, cellWidth, cellHeight);
      
      // Bordure de cellule
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cellWidth, cellHeight);
      
      // Afficher le nombre si > 0
      if (cellData.total > 0) {
        ctx.fillStyle = intensity > 0.7 ? '#fff' : '#2c3e50';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(cellData.total, x + cellWidth/2, y + cellHeight/2 + 3);
      }
    }
  }
  
  // Dessiner les étiquettes
  ctx.fillStyle = '#2c3e50';
  ctx.font = '12px sans-serif';
  
  // Étiquettes des jours
  for (let day = 0; day < daysOfWeek.length; day++) {
    const y = padding + day * cellHeight + cellHeight / 2 + 4;
    ctx.textAlign = 'right';
    ctx.fillText(daysOfWeek[day], padding - 10, y);
  }
  
  // Étiquettes des heures
  for (let hour = 0; hour < hoursOfDay.length; hour += 4) {
    const x = padding + hour * cellWidth + cellWidth / 2;
    ctx.textAlign = 'center';
    ctx.fillText(hoursOfDay[hour], x, padding - 10);
  }
  
  // Légende
  const legendY = height - 15;
  ctx.font = '12px sans-serif';
  
  let legendX = width / 4;
  for (const type in colors) {
    // Carré de couleur
    ctx.fillStyle = colors[type];
    ctx.fillRect(legendX - 40, legendY - 8, 12, 12);
    
    // Texte
    ctx.fillStyle = '#2c3e50';
    ctx.textAlign = 'left';
    ctx.fillText(type, legendX - 25, legendY);
    
    legendX += width / 4;
  }
}

// Ajouter au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
  // Ajouter un délai pour s'assurer que tout est chargé
  setTimeout(() => {
    // Créer le canvas personnalisé
    createCustomCanvas();
    
    // Ajouter un écouteur pour mettre à jour le canvas quand les filtres changent
    const dateFilterSelect = document.getElementById('date-filter');
    if (dateFilterSelect) {
      const originalOnChange = dateFilterSelect.onchange;
      dateFilterSelect.onchange = function(e) {
        if (originalOnChange) originalOnChange.call(this, e);
        setTimeout(() => {
          const vizType = document.getElementById('viz-type');
          if (vizType) drawCustomVisualization(vizType.value);
        }, 100);
      };
    }
  }, 1000);
});
        };
        reader.readAsText(file);
    }
});
