// Define custom Blockly blocks for JSON
Blockly.Blocks['json_object'] = {
  init: function() {
    this.appendStatementInput('MEMBERS')
        .setCheck('KeyValue')
        .appendField('Object');
    this.setOutput(true, 'JSON');
    this.setColour(230);
    this.setTooltip('Create a JSON object');
  }
};

Blockly.Blocks['json_key_value'] = {
  init: function() {
    this.appendValueInput('VALUE')
        .setCheck(['String', 'Number', 'Boolean', 'JSON'])
        .appendField(new Blockly.FieldTextInput('key'), 'KEY')
        .appendField(':');
    this.setPreviousStatement(true, 'KeyValue');
    this.setNextStatement(true, 'KeyValue');
    this.setColour(160);
    this.setTooltip('Add a key-value pair');
  }
};

Blockly.Blocks['json_array'] = {
  init: function() {
    this.appendStatementInput('ITEMS')
        .setCheck('Array_Item')
        .appendField('Array');
    this.setOutput(true, 'JSON');
    this.setColour(290);
    this.setTooltip('Create a JSON array');
  }
};

Blockly.Blocks['json_array_item'] = {
  init: function() {
    this.appendValueInput('ITEM')
        .setCheck(['String', 'Number', 'Boolean', 'JSON']);
    this.setPreviousStatement(true, 'Array_Item');
    this.setNextStatement(true, 'Array_Item');
    this.setColour(290);
    this.setTooltip('Add an item to the array');
  }
};

// JavaScript generators for the blocks
Blockly.JavaScript['json_object'] = function(block) {
  let members = Blockly.JavaScript.statementToCode(block, 'MEMBERS');
  // Remove trailing comma from members
  members = members.replace(/,\s*$/, '');
  // Don't add semicolon at the end
  const code = `{\n${members}}`;
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.JavaScript['json_key_value'] = function(block) {
  const key = block.getFieldValue('KEY');
  const value = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_ATOMIC);
  const comma = block.getNextBlock() ? ',' : '';
  // Remove any trailing semicolons and ensure double quotes
  const cleanValue = value.replace(/;$/, '').replace(/'/g, '"').trim();
  return `"${key}": ${cleanValue}${comma}\n`;
};

Blockly.JavaScript['json_array'] = function(block) {
  let items = Blockly.JavaScript.statementToCode(block, 'ITEMS');
  // Remove trailing comma from items
  items = items.replace(/,\s*$/, '');
  // Don't add semicolon at the end
  const code = `[\n${items}]`;
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.JavaScript['json_array_item'] = function(block) {
  const item = Blockly.JavaScript.valueToCode(block, 'ITEM', Blockly.JavaScript.ORDER_ATOMIC);
  const comma = block.getNextBlock() ? ',' : '';
  // Remove any trailing semicolons and ensure double quotes
  const cleanItem = item.replace(/;$/, '').replace(/'/g, '"').trim();
  return `${cleanItem}${comma}\n`;
};