// create a variable to hold db connection
let db
// establish a connection to IndexDB database called "budget_tracker" and set it to version 1
const request = indexedDB.open('budget_tracker', 1);

// this event will emit the database version changes 
request.onupgradeneeded = function(event) {
    // save a reference to the database
    const db = event.target.result;
    // create an object store (table) called `new_budget`, set it to have auto incrementing key of sorts 
    db.createObjectStore('new_budget', {autoIncrement: true});
};

// upon a seccessful

request.onsuccess = function(event) {
    //when db is successfully created with its object store
    db = event.target.result;

    // check if app is online, if yes run uploadBudget() function to send all local data to api
    if (navigator.online) {
        uploadBudget();
    }
};

request.onerror = function(event) {
    // log error here
    console.log(event.target.errorCode);
};

// this function will be excuted if we attempt to submit a new budget and theres no internet connection
function saveRecord(record) {
    // open a new transaction with the database with read and write permission
    const transaction = db.transaction(['new_budget'], 'readwrite');

    // access the object store for `new_transaction`
    const budgetObjectStore = transaction.objectStore('new_budget');

    // add record to your store with add method
    budgetObjectStore.add(record);
};

function uploadBudget(){
    //open a transaction on your db
    const transaction = db.transaction(['new_budget'], 'readwrite');

    //access your object store
    const budgetObjectStore = transaction.objectStore('new_budget');

    // get all records from store and set to a variable
    const getAll = budgetObjectStore.getAll();

    // upon a sucessful .getALl() excution, run this function
    getAll.onsuccess = function() {
        // if there is data in indexDb's store, lets send it to the api server
        if (getAll.result.length > 0) {
            fetch('/api/budget', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: ' application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }
                    // open one more transaction
                    const transaction = db.transaction(['new_budget'], 'readwrite');
                    //access the new_budget object store
                    const budgetObjectStore = transaction.objectStore('new_budget');
                    // clear all times in your store
                    budgetObjectStore.clear();

                    alert('All saved budget has been submitted!');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    };
};

//listen for app coming back online
window.addEventListener('online', uploadBudget)