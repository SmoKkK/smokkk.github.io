class Terminal {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.typeDelay = 50;
    this.commandDelay = 1000;
    this.commands = [
      { 
        command: 'whoami',
        output: '<i class="fas fa-user mr-2"></i>Nuti, The Creator - Almost Full Stack Developer'
      },
      {
        command: 'cat about.txt',
        output: `<i class="fas fa-file-alt mr-2"></i>A passionate developer with 2+ years of experience in building windows applications.
Currently Specializing in Cloud Technologies.`
      },
      {
        command: 'ls skills/',
        output: `<i class="fas fa-folder-open mr-2"></i>Languages/
<i class="fab fa-python mr-2"></i>Python     <i class="fas fa-code mr-2"></i>C++
<i class="fab fa-microsoft mr-2"></i>C#       <i class="fab fa-js mr-2"></i>JavaScript
<i class="fas fa-terminal mr-2"></i>Perl      <i class="fas fa-moon mr-2"></i>LUA`
      },
      {
        command: 'cat interests.txt',
        output: `<i class="fas fa-fist-raised mr-2"></i>• Online Activism
<i class="fas fa-shield-alt mr-2"></i>• Online Security
<i class="fas fa-laptop-code mr-2"></i>• Front-end Learning`
      }
    ];

    // Set up terminal collapse functionality
    this.setupCollapse();
  }

  setupCollapse() {
    const header = document.getElementById('terminal-header');
    const content = this.container;
    const toggleIcon = document.getElementById('terminal-toggle-icon');
    
    header.addEventListener('click', () => {
      content.classList.toggle('hidden');
      toggleIcon.classList.toggle('rotate-180');
    });
  }

  async typeText(text, element) {
    element.innerHTML = ''; // Clear existing content
    const chars = text.split('');
    let html = '';
    
    for (let char of chars) {
      html += char;
      element.innerHTML = html;
      await new Promise(resolve => setTimeout(resolve, this.typeDelay));
    }
  }

  createCommandLine() {
    const line = document.createElement('div');
    line.className = 'command-line mb-2';
    
    const prompt = document.createElement('span');
    prompt.className = 'prompt-symbol';
    prompt.innerHTML = '<i class="fas fa-angle-right"></i>';
    
    const commandSpan = document.createElement('span');
    commandSpan.className = 'command typed-text ml-2';
    
    line.appendChild(prompt);
    line.appendChild(commandSpan);
    
    return { line, commandSpan };
  }

  createOutput(text) {
    const output = document.createElement('div');
    output.className = 'output typed-text mb-4';
    output.innerHTML = text;
    return output;
  }

  async startTerminal() {
    for (let cmd of this.commands) {
      const { line, commandSpan } = this.createCommandLine();
      this.container.appendChild(line);
      
      await this.typeText(cmd.command, commandSpan);
      await new Promise(resolve => setTimeout(resolve, this.commandDelay));
      
      const output = this.createOutput(cmd.output);
      this.container.appendChild(output);
    }

    // Add final command line with blinking cursor
    const finalLine = this.createCommandLine();
    const cursor = document.createElement('span');
    cursor.className = 'cursor';
    finalLine.line.appendChild(cursor);
    this.container.appendChild(finalLine.line);
  }
}

// Initialize and start the terminal when the page loads
document.addEventListener('DOMContentLoaded', () => {
  const terminal = new Terminal('terminal-content');
  terminal.startTerminal();
});