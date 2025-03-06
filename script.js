document.addEventListener('DOMContentLoaded', function() {
    const tagForm = document.getElementById('tag-form');
    const qaeCount = document.getElementById('qae-count');
    const qasCount = document.getElementById('qas-count');
    const injCount = document.getElementById('inj-count');
    const tagsBody = document.getElementById('tags-body');
    const tagCount = document.getElementById('tag-count');
    const noTagsMessage = document.getElementById('no-tags-message');

    let tagData = [];

    tagForm.addEventListener('submit', function(event) {
        event.preventDefault();

        // Récupérer les valeurs du formulaire
        const tagType = document.getElementById('tag-type').value;
        const tagNotes = document.getElementById('tag-notes').value;
        const tagDate = new Date().toLocaleDateString(); // Date actuelle

        if (tagType) {
            // Créer un nouvel objet tag
            const newTag = {
                date: tagDate,
                type: tagType,
                notes: tagNotes
            };

            // Ajouter le tag à la liste des tags
            tagData.push(newTag);
            addTagToTable(newTag);
            updateStatistics();

            // Réinitialiser le formulaire
            tagForm.reset();
        }
    });

    function addTagToTable(tag) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${tag.date}</td>
            <td>${tag.type}</td>
            <td>${tag.notes}</td>
            <td><button class="btn delete-btn">Supprimer</button></td>
        `;
        tagsBody.appendChild(row);

        // Ajouter un écouteur d'événement pour le bouton de suppression
        row.querySelector('.delete-btn').addEventListener('click', function() {
            deleteTag(row, tag);
        });

        // Mettre à jour le message "Aucun tag trouvé"
        noTagsMessage.style.display = 'none';
        tagCount.innerText = tagData.length;
    }

    function updateStatistics() {
        const counts = {
            'QAE KO': 0,
            'QAS KO': 0,
            'INJ': 0
        };

        tagData.forEach(tag => {
            if (counts[tag.type] !== undefined) {
                counts[tag.type]++;
            }
        });

        qaeCount.innerText = counts['QAE KO'];
        qasCount.innerText = counts['QAS KO'];
        injCount.innerText = counts['INJ'];
    }

    function deleteTag(row, tag) {
        row.remove();
        tagData = tagData.filter(t => t !== tag);
        updateStatistics();

        // Mettre à jour le message "Aucun tag trouvé"
        if (tagData.length === 0) {
            noTagsMessage.style.display = 'block';
        }
        tagCount.innerText = tagData.length;
    }
});
