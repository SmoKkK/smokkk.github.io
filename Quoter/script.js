let isAutoMode = true;

function getRandomIntellectual(category = null) {
  const filtered = category 
    ? intellectuals.filter(i => i.category === category)
    : intellectuals;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

function populateSelectOptions() {
  const select = document.getElementById('figureSelect');
  intellectuals.forEach(intellectual => {
    const option = document.createElement('option');
    option.value = intellectual.name;
    option.text = intellectual.name;
    option.dataset.category = intellectual.category;
    select.appendChild(option);
  });
}

function toggleMode(mode) {
  isAutoMode = mode === 'auto';
  document.getElementById('autoBtn').classList.toggle('active', isAutoMode);
  document.getElementById('manualBtn').classList.toggle('active', !isAutoMode);
  document.getElementById('figureSelect').classList.toggle('visible', !isAutoMode);
}

function updateWarning() {
  const select = document.getElementById('figureSelect');
  const warning = document.getElementById('categoryWarning');
  const selectedOption = select.options[select.selectedIndex];
  
  if (selectedOption && selectedOption.dataset.category === 'controversial') {
    warning.classList.add('visible');
  } else {
    warning.classList.remove('visible');
  }
}

function generateQuote() {
  const quoteText = document.getElementById('quoteInput').value.trim();
  
  if (!quoteText) {
    alert('Please enter some text first!');
    return;
  }

  let intellectual;
  if (isAutoMode) {
    intellectual = getRandomIntellectual();
  } else {
    const selectedName = document.getElementById('figureSelect').value;
    intellectual = intellectuals.find(i => i.name === selectedName);
  }
  
  const img = document.getElementById('intellectualImage');
  img.src = intellectual.image;
  document.getElementById('quoteText').textContent = `"${quoteText}"`;
  document.getElementById('intellectualName').textContent = `- ${intellectual.name}`;
  
  document.getElementById('downloadBtn').style.display = 'block';
}

function downloadQuote() {
  const container = document.getElementById('quoteContainer');
  const img = document.getElementById('intellectualImage');

  // Create a loading indicator
  const loadingText = document.createElement('div');
  loadingText.textContent = 'Preparing download...';
  loadingText.style.color = 'white';
  loadingText.style.textAlign = 'center';
  loadingText.style.padding = '10px';
  document.querySelector('.result-section').insertBefore(loadingText, document.getElementById('downloadBtn'));

  // Ensure image is fully loaded
  const imageLoaded = new Promise((resolve, reject) => {
    if (img.complete) {
      resolve();
    } else {
      img.onload = resolve;
      img.onerror = reject;
    }
  });

  imageLoaded
    .then(() => {
      return html2canvas(container, {
        backgroundColor: '#000000',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        onclone: function(clonedDoc) {
          const clonedImg = clonedDoc.getElementById('intellectualImage');
          clonedImg.crossOrigin = 'anonymous';
          // Ensure cloned image is loaded
          return new Promise(resolve => {
            if (clonedImg.complete) {
              resolve();
            } else {
              clonedImg.onload = resolve;
            }
          });
        }
      });
    })
    .then(canvas => {
      // Remove loading indicator
      loadingText.remove();
      
      // Create download link
      const link = document.createElement('a');
      link.download = 'intellectual-quote.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    })
    .catch(error => {
      console.error('Error generating quote image:', error);
      loadingText.textContent = 'Error generating image. Please try again.';
      setTimeout(() => loadingText.remove(), 3000);
    });
}

document.addEventListener('DOMContentLoaded', () => {
  populateSelectOptions();
  document.getElementById('figureSelect').addEventListener('change', updateWarning);
});

document.addEventListener('keydown', function(e) {
  if (e.ctrlKey && e.key === 'Enter') {
    generateQuote();
  }
});