//Global variable
let failed = false;
let SenderMaxBitsNumber=0;
let blockSize;
let dataHammingCode;
let pyodide = null;

let flippedCells = [];
let paritybits=[];

// Get DOM elements
const senderDataInput = document.getElementById('sender-data');
const blockSizeInput = document.getElementById('block-size');
const generateBlockBtn = document.getElementById('generate-block');
const sendDataBtn = document.getElementById('code-data');
const interruptBtn = document.getElementById('submit-interruptions');
const blockContainer = document.getElementById('block-container');
const receiveddatalbl = document.getElementById('received-data');
const retryBtn = document.getElementById('retry-btn');


//Events

// Sender Data - only 1s and 0s
senderDataInput.addEventListener('input', (e)=> {
    e.target.value = e.target.value.replace(/[^01]/g, '');
});

// Block Size - check if even
generateBlockBtn.addEventListener('click', ()=> {
    blockSize = parseInt(blockSizeInput.value);
    
    if (blockSize % 2 !== 0) {
        failed=true;
        alert('Error initializing memory block, please try a perfect square block');
        return;
    }
    else{
        failed =false;
    }
    
    // Generate block logic here
    
})

// Send button
sendDataBtn.addEventListener('click', async (e)=> {
   const senderData = senderDataInput.value.trim();
   
   if (senderData === '') {
       alert('Please enter sender data');
       return;
   }
   if(CheckSenderDataLength()){
    alert('Word excedded the block limit')
    senderDataInput.value='';
        return;
   }

   
   sendDataBtn.disabled = true;
   generateBlockBtn.disabled = true;
 
   const result = await runPythonFunction("set_hamming_code", [senderData, 2 ** blockSize]);

   dataHammingCode = result

   InitializeHammingToGrid()
   interruptBtn.disabled=false;

});

//Interrupt Button
interruptBtn.addEventListener('click', async()=>{
    //Apply interrupts on the string
    dataHammingCode = applyInterrupts();
    disableCellFlipping();

    receiveddatalbl.value=dataHammingCode;


    error_status = await runPythonFunction("check_hamming_code", [dataHammingCode, 2 ** blockSize]);
    setReceiverResult(error_status)
})

retryBtn.addEventListener('click', function retrySend() {
    // Reset global state
    flippedCells = [];
    failed = false;
    dataHammingCode = null;
    interruptBtn.disabled = true;
    sendDataBtn.disabled = false;
    generateBlockBtn.disabled = false;

    // Reset input fields
    senderDataInput.value = '';
    receiveddatalbl.value = '';
    document.getElementById('receiver-result').value = '';
    sendDataBtn.disabled=true;

    // Clear the block
    blockContainer.innerHTML = '';

    // Allow user to re-enter data
    const senderDataLabel = document.querySelector('label[for="sender-data"]');
    senderDataLabel.textContent = 'Sender Word:';
});



document.getElementById('generate-block').addEventListener('click', ()=> {

    const logArgument = parseInt(document.getElementById('block-size').value, 10);
    if (logArgument>8){failed=true}

    if(!failed){

    blockContainer.innerHTML = ''; // Clear previous block

    SenderMaxBitsNumber = (2**logArgument) - (logArgument) - 1;
    console.log(SenderMaxBitsNumber)

    const senderDataLabel = document.querySelector('label[for="sender-data"]');
    senderDataLabel.textContent = 'Sender Word (Max ' + SenderMaxBitsNumber + ' bits):';
     
    let rowandcolSize = Math.sqrt(Math.pow(2,logArgument));
    let cellIndex = 0;

    // Create cells in row-by-row order
    for (let row = 0; row < rowandcolSize; row++) {
        for (let col = 0; col < rowandcolSize; col++) {
            const cell = document.createElement('div');
            cell.className = 'block-cell';
            cell.textContent = '0';
            cell.style.gridRow = row + 1;
            cell.style.gridColumn = col + 1;
            cell.dataset.index = cellIndex;
            cellIndex++;
            blockContainer.appendChild(cell); // Add directly to container, not row
        }
    }
    
    sendDataBtn.disabled = false;
    generateBlockBtn.disabled = true;
    }
});

//Helper functions
function CheckSenderDataLength() {
        if (senderDataInput.value.length > SenderMaxBitsNumber) 
            return 1;
}

function InitializeHammingToGrid() {
   const cells = blockContainer.querySelectorAll('.block-cell');
   
   // Loop through each character in the result string
   parityBit=1;

    cells[0].style.backgroundColor = 'lightgreen';

  for (let i = 0; i < dataHammingCode.length && i < cells.length; i++) {

    // add event listener for flipping bits
    cells[i].addEventListener('click', flipBit);

    //Color of parity bits
    if(i==parityBit){
        //color cell with light green
        cells[i].style.backgroundColor = 'lightgreen';
        parityBit<<=1
    }

    cells[i].textContent = dataHammingCode[i];

   }
}

const flipBit = async (event) => {
   const cell = event.target;
   const cellIndex = parseInt(cell.dataset.index);
   
   const isAlreadyFlipped = flippedCells.includes(cellIndex);
   
   if (isAlreadyFlipped) {
       flippedCells = flippedCells.filter(index => index !== cellIndex);
       // Check if parity bit (positions 0, 1, 2, 4, 8, 16...)
       const isParity = cellIndex === 0 || (cellIndex & (cellIndex - 1)) === 0;
       cell.style.backgroundColor = isParity ? 'lightgreen' : '';
   } else {
       if (flippedCells.length >= 2) {
           alert('Maximum flips you can do are two');
           return;
       }
       flippedCells.push(cellIndex);
       cell.style.backgroundColor = 'red';
   }
   
   cell.textContent = cell.textContent === '1' ? '0' : '1';
}

function applyInterrupts() {
   let dataArray = dataHammingCode.split('');
   
   // Flip the bits at interrupted positions
   flippedCells.forEach(index => {
       dataArray[index] = dataArray[index] === '1' ? '0' : '1';
   });
   
   interruptBtn.disabled=true;
   return dataArray.join('');
}

function setReceiverResult(status_code) {
   const receiverResult = document.getElementById('receiver-result');
   const cells = document.querySelectorAll('.block-cell');

   switch (status_code) {
       case 0:
           receiverResult.style.color = 'green';
           receiverResult.value = `No errors detected!`;
           break;
       case -1:
           receiverResult.style.color = 'red';
           receiverResult.value = `2-bits errors detected. Unable to correct`;
           break;
       default:
           if (status_code > 0) {
               receiverResult.style.color = 'orange';
                fixed_bit=Number(!dataHammingCode[status_code-1]);

               receiverResult.value = `1-bit error at position ${status_code-1}`;
               
               //Update corrupted bit
               dataHammingCode[status_code-1]=fixed_bit;
               cells[status_code-1].style.backgroundColor='yellow';
               cells[status_code - 1].setAttribute('data-index', fixed_bit);

           }
           break;
   }
}

function disableCellFlipping() {
    const cells = document.querySelectorAll('.block-cell');
   cells.forEach(cell => {
       cell.removeEventListener('click', flipBit);
       cell.style.cursor = 'not-allowed'; // Visual indication
   });
}

// Connecting to python code
async function runPythonFunction(functionName, args = []) {
    // Initialize Pyodide once
    if (!pyodide) {
        pyodide = await loadPyodide();
        const response = await fetch('src/scripts/main.py');
        const pythonCode = await response.text();
        pyodide.runPython(pythonCode);
    }

    // Prepare Python call string
    const pyArgs = args.map(arg => 
        typeof arg === "string" ? `"${arg}"` : arg
    ).join(", ");

    const result = pyodide.runPython(`${functionName}(${pyArgs})`);
    return result;
}

