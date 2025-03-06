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
    
    // Initialisation des graphiques
    initCharts();
    
    // Charger les tags depuis Supabase
    loadTags();
    
    // Configurer les écoutes en temps réel
    setupRealtime();
    
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
    
    // Charger les tags depuis Supabase
    async function loadTags() {
        try {
            console.log("Chargement des tags depuis Supabase");
            
            const { data, error } = await supabase
                .from('tags')
                .select('*')
                .order('date', { ascending: false });
                
            if (error) throw error;
            
            console.log("Tags chargés:", data.length);
            allTags = data;
            filterTags();
        } catch (error) {
            console.error("Erreur lors du chargement des tags:", error);
            alert("Erreur lors du chargement des données. Veuillez rafraîchir la page.");
        }
    }
    
    // Configurer les écouteurs en temps réel
    function setupRealtime() {
        supabase
            .channel('public:tags')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'tags' 
            }, payload => {
                console.log("Changement détecté:", payload);
                // Recharger les tags à chaque changement
                loadTags();
            })
            .subscribe();
    }
    
    // Fonction pour ajouter un tag
    async function addTag() {
        const type = tagTypeSelect.value;
        const notes = tagNotesInput.value;
        
        console.log("Tentative d'ajout d'un tag", { type, notes });
        
        if (!type) {
            alert("Veuillez sélectionner un type de tag");
            return;
        }
        
        try {
            const { data, error } = await supabase
                .from('tags')
                .insert([{ type, notes }])
                .select();
                
            if (error) throw error;
            
            console.log("Tag ajouté:", data);
            
            // Réinitialiser le formulaire
            tagTypeSelect.value = '';
            tagNotesInput.value = '';
            tagTypeSelect.focus();
            
        } catch (error) {
            console.error("Erreur lors de l'ajout du tag:", error);
            alert("Erreur lors de l'ajout du tag. Veuillez réessayer.");
        }
    }
    
    // Supprimer un tag
    async function deleteTag(id) {
        console.log("Suppression du tag avec ID:", id);
        
        try {
            const { error } = await supabase
                .from('tags')
                .delete()
                .eq('id', id);
                
            if (error) throw error;
            
            console.log("Tag supprimé avec succès");
            
        } catch (error) {
            console.error("Erreur lors de la suppression du tag:", error);
            alert("Erreur lors de la suppression du tag. Veuillez réessayer.");
        }
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
    
    // Le reste de votre code reste pratiquement identique
    // (formatDate, countTagsByType, updateCharts, etc.)
});
