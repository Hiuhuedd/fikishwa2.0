const { getFirestoreApp } = require('./firebase');
const { collection, getDocs, updateDoc, doc } = require('firebase/firestore');

async function run() {
    const db = getFirestoreApp();
    const categoriesRef = collection(db, 'vehicleCategories');
    const snapshot = await getDocs(categoriesRef);

    for (const d of snapshot.docs) {
        const data = d.data();
        let imageUrl = null;
        if (d.id === 'fikaa' || data.name?.toLowerCase() === 'fikaa') {
            imageUrl = 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png'; // Example standard car
        } else if (d.id === 'premium' || data.name?.toLowerCase() === 'premium') {
            imageUrl = 'https://cdn-icons-png.flaticon.com/512/5969/5969046.png'; // Example premium car
        } else {
            imageUrl = 'https://cdn-icons-png.flaticon.com/512/1048/1048313.png'; // Generic car
        }
        
        console.log(`Updating category ${d.id} with imageUrl: ${imageUrl}`);
        await updateDoc(doc(db, 'vehicleCategories', d.id), {
            imageUrl: imageUrl
        });
    }

    console.log('Update Complete!');
    process.exit(0);
}

run().catch(console.error);
