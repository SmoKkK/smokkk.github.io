// Initialize CodeMirror
const jsonEditor = CodeMirror.fromTextArea(document.getElementById('jsonEditor'), {
  mode: 'application/json',
  theme: 'monokai',
  lineNumbers: true,
  autoCloseBrackets: true,
  matchBrackets: true,
  indentUnit: 2
});

// Initialize Blockly
const workspace = Blockly.inject('blockEditor', {
  toolbox: `
    <xml>
      <category name="JSON" colour="230">
        <block type="json_object"></block>
        <block type="json_key_value"></block>
        <block type="json_array"></block>
        <block type="json_array_item"></block>
      </category>
      <category name="Values" colour="160">
        <block type="text"></block>
        <block type="math_number"></block>
        <block type="logic_boolean"></block>
      </category>
    </xml>
  `,
  scrollbars: true,
  trashcan: true
});

// Event handlers
document.getElementById('validateBtn').addEventListener('click', validateJSON);
document.getElementById('formatBtn').addEventListener('click', formatJSON);
document.getElementById('clearBtn').addEventListener('click', clearEditor);

// Function to create a key-value block
function createKeyValueBlock(workspace, key, value) {
  const kvBlock = workspace.newBlock('json_key_value');
  kvBlock.setFieldValue(key, 'KEY');
  
  let valueBlock;
  if (typeof value === 'string') {
    valueBlock = workspace.newBlock('text');
    valueBlock.setFieldValue(value, 'TEXT');
  } else if (typeof value === 'number') {
    valueBlock = workspace.newBlock('math_number');
    valueBlock.setFieldValue(value, 'NUM');
  } else if (typeof value === 'boolean') {
    valueBlock = workspace.newBlock('logic_boolean');
    valueBlock.setFieldValue(value ? 'TRUE' : 'FALSE', 'BOOL');
  } else if (Array.isArray(value)) {
    valueBlock = createArrayBlock(workspace, value);
  } else if (typeof value === 'object' && value !== null) {
    valueBlock = createObjectBlock(workspace, value);
  }

  if (valueBlock) {
    kvBlock.getInput('VALUE').connection.connect(valueBlock.outputConnection);
  }
  return kvBlock;
}

// Function to create an array block
function createArrayBlock(workspace, array) {
  const arrayBlock = workspace.newBlock('json_array');
  let previousBlock = null;

  array.forEach((item) => {
    const arrayItemBlock = workspace.newBlock('json_array_item');
    let valueBlock;

    if (typeof item === 'string') {
      valueBlock = workspace.newBlock('text');
      valueBlock.setFieldValue(item, 'TEXT');
    } else if (typeof item === 'number') {
      valueBlock = workspace.newBlock('math_number');
      valueBlock.setFieldValue(item, 'NUM');
    } else if (typeof item === 'boolean') {
      valueBlock = workspace.newBlock('logic_boolean');
      valueBlock.setFieldValue(item ? 'TRUE' : 'FALSE', 'BOOL');
    } else if (typeof item === 'object') {
      valueBlock = createObjectBlock(workspace, item);
    }

    if (valueBlock) {
      arrayItemBlock.getInput('ITEM').connection.connect(valueBlock.outputConnection);
    }

    if (previousBlock) {
      arrayItemBlock.previousConnection.connect(previousBlock.nextConnection);
    } else {
      arrayItemBlock.previousConnection.connect(arrayBlock.getInput('ITEMS').connection);
    }
    previousBlock = arrayItemBlock;
  });

  return arrayBlock;
}

// Function to create an object block
function createObjectBlock(workspace, obj) {
  const objectBlock = workspace.newBlock('json_object');
  let previousBlock = null;

  Object.entries(obj).forEach(([key, value]) => {
    const kvBlock = createKeyValueBlock(workspace, key, value);
    
    if (previousBlock) {
      kvBlock.previousConnection.connect(previousBlock.nextConnection);
    } else {
      kvBlock.previousConnection.connect(objectBlock.getInput('MEMBERS').connection);
    }
    previousBlock = kvBlock;
  });

  return objectBlock;
}

// Function to update Blockly workspace from JSON
function updateBlocklyFromJSON(jsonString) {
  try {
    const json = JSON.parse(jsonString);
    workspace.clear();
    const rootBlock = createObjectBlock(workspace, json);
    rootBlock.moveTo(50, 50);
    workspace.getAllBlocks().forEach(block => block.initSvg());
    workspace.render();
  } catch (error) {
    console.error('Error updating Blockly:', error);
  }
}

// Sync block editor with text editor
workspace.addChangeListener(() => {
  try {
    let code = Blockly.JavaScript.workspaceToCode(workspace);
    // Remove any trailing semicolons before formatting
    code = code.replace(/;+\s*$/, '');
    const formattedCode = formatJSONString(code);
    if (formattedCode !== jsonEditor.getValue()) {
      jsonEditor.setValue(formattedCode);
    }
  } catch (error) {
    console.error('Error updating editor:', error);
  }
});

// Add change listener to JSON editor
jsonEditor.on('change', (cm, change) => {
  if (change.origin !== 'setValue') {
    try {
      const jsonString = cm.getValue();
      updateBlocklyFromJSON(jsonString);
    } catch (error) {
      console.error('Error parsing JSON:', error);
    }
  }
});

function validateJSON() {
  const outputDisplay = document.getElementById('outputDisplay');
  try {
    const jsonString = jsonEditor.getValue();
    const parsed = JSON.parse(jsonString);
    outputDisplay.innerHTML = '<span class="success">✓ Valid JSON</span>';
    outputDisplay.appendChild(document.createElement('pre')).textContent = 
      JSON.stringify(parsed, null, 2);
  } catch (error) {
    outputDisplay.innerHTML = `<span class="error">✗ Invalid JSON: ${error.message}</span>`;
  }
}

function formatJSON() {
  try {
    const jsonString = jsonEditor.getValue();
    const formatted = formatJSONString(jsonString);
    jsonEditor.setValue(formatted);
  } catch (error) {
    document.getElementById('outputDisplay').innerHTML = 
      `<span class="error">Error formatting JSON: ${error.message}</span>`;
  }
}

function formatJSONString(jsonString) {
  try {
    // Clean up any invalid JSON that might have trailing commas or incorrect quotes
    const cleanJson = jsonString
      .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas in objects and arrays
      .replace(/,\s*$/m, '') // Remove trailing commas at the end of lines
      .replace(/;+/g, '') // Remove any semicolons (one or more)
      .replace(/'/g, '"') // Replace all single quotes with double quotes
      .replace(/:\s*'([^']*)'/g, ':"$1"') // Replace quoted values with double quotes
      .trim(); // Trim any whitespace
    
    const parsed = JSON.parse(cleanJson);
    return JSON.stringify(parsed, null, 2);
  } catch (error) {
    // If parsing fails, return the original string
    return jsonString;
  }
}

function clearEditor() {
  jsonEditor.setValue('');
  workspace.clear();
  document.getElementById('outputDisplay').innerHTML = '';
}

// Initialize with sample JSON
const initialJSON = {
  "name": "John Doe",
  "age": 30,
  "isStudent": false,
  "hobbies": ["reading", "gaming", "coding"],
  "address": {
    "street": "123 Main St",
    "city": "Anytown",
    "country": "USA"
  }
};

jsonEditor.setValue(JSON.stringify(initialJSON, null, 2));
updateBlocklyFromJSON(JSON.stringify(initialJSON));

document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('themeToggle');
  const html = document.documentElement;
  
  // Check for saved theme preference
  const savedTheme = localStorage.getItem('theme') || 'dark';
  html.classList.toggle('dark', savedTheme === 'dark');
  
  themeToggle.addEventListener('click', () => {
    html.classList.toggle('dark');
    localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
    
    // Update CodeMirror theme
    if (html.classList.contains('dark')) {
      jsonEditor.setOption('theme', 'monokai');
    } else {
      jsonEditor.setOption('theme', 'default');
    }
  });
  
  // Set initial CodeMirror theme
  if (html.classList.contains('dark')) {
    jsonEditor.setOption('theme', 'monokai');
  }
});