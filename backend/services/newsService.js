const { getFirestoreApp } = require('../firebase');
const { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } = require('firebase/firestore');

const db = getFirestoreApp();
const COLLECTION_NAME = 'news';

const createNews = async (data, adminId) => {
    try {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...data,
            createdBy: adminId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return { id: docRef.id, ...data };
    } catch (error) {
        throw error;
    }
};

const getNews = async (includeUnpublished = false) => {
    try {
        const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const newsList = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (includeUnpublished || data.status === 'published') {
                newsList.push({ id: doc.id, ...data });
            }
        });
        return newsList;
    } catch (error) {
        throw error;
    }
};

const updateNews = async (id, data, adminId) => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            ...data,
            updatedBy: adminId,
            updatedAt: serverTimestamp()
        });
        return { id, ...data };
    } catch (error) {
        throw error;
    }
};

const deleteNews = async (id) => {
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
        return { success: true };
    } catch (error) {
        throw error;
    }
};

module.exports = {
    createNews,
    getNews,
    updateNews,
    deleteNews
};
