import * as THREE from 'three';

export class ControlPanels {
  constructor(scene) {
    this.scene = scene;
    this.panels = [];
    this.hoveredPanel = null;
    this.selectedPanel = null;
    
    this.createPanels();
  }
  
  createPanels() {
    const panelConfigs = [
      {
        name: 'BPM Control',
        position: new THREE.Vector3(-2, 1.5, -2),
        controls: ['60', '90', '120', '140', '160', '180'],
        type: 'bpm'
      },
      {
        name: 'Pattern',
        position: new THREE.Vector3(0, 1.5, -2.5),
        controls: ['Simple', 'Complex', 'Chaos', 'Minimal', 'Dense', 'Random'],
        type: 'pattern'
      },
      {
        name: 'Visual Mode',
        position: new THREE.Vector3(2, 1.5, -2),
        controls: ['Orb', 'Bars', 'Particles', 'All', 'Minimal', 'Psychedelic'],
        type: 'visual'
      }
    ];
    
    panelConfigs.forEach((config, index) => {
      const panel = this.createPanel(config);
      this.panels.push(panel);
      this.scene.add(panel.group);
    });
  }
  
  createPanel(config) {
    const group = new THREE.Group();
    group.position.copy(config.position);
    
    const panelGeometry = new THREE.BoxGeometry(1.5, 1, 0.1);
    const panelMaterial = new THREE.MeshPhongMaterial({
      color: 0x222244,
      emissive: 0x111122,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.8
    });
    
    const panelMesh = new THREE.Mesh(panelGeometry, panelMaterial);
    group.add(panelMesh);
    
    const borderGeometry = new THREE.EdgesGeometry(panelGeometry);
    const borderMaterial = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      linewidth: 2
    });
    const border = new THREE.LineSegments(borderGeometry, borderMaterial);
    group.add(border);
    
    const titleCanvas = this.createTextCanvas(config.name, 256, 64);
    const titleTexture = new THREE.CanvasTexture(titleCanvas);
    const titleMaterial = new THREE.MeshBasicMaterial({
      map: titleTexture,
      transparent: true,
      side: THREE.DoubleSide
    });
    
    const titleGeometry = new THREE.PlaneGeometry(0.8, 0.2);
    const titleMesh = new THREE.Mesh(titleGeometry, titleMaterial);
    titleMesh.position.set(0, 0.35, 0.06);
    group.add(titleMesh);
    
    const buttons = [];
    const buttonWidth = 0.4;
    const buttonHeight = 0.15;
    const buttonSpacing = 0.05;
    const startX = -0.5;
    const startY = 0.1;
    
    config.controls.forEach((label, i) => {
      const row = Math.floor(i / 3);
      const col = i % 3;
      
      const buttonGroup = new THREE.Group();
      
      const buttonGeometry = new THREE.BoxGeometry(buttonWidth, buttonHeight, 0.05);
      const buttonMaterial = new THREE.MeshPhongMaterial({
        color: 0x4444aa,
        emissive: 0x222255,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.9
      });
      
      const buttonMesh = new THREE.Mesh(buttonGeometry, buttonMaterial);
      buttonGroup.add(buttonMesh);
      
      const buttonBorderGeometry = new THREE.EdgesGeometry(buttonGeometry);
      const buttonBorder = new THREE.LineSegments(buttonBorderGeometry, borderMaterial);
      buttonGroup.add(buttonBorder);
      
      const labelCanvas = this.createTextCanvas(label, 128, 32);
      const labelTexture = new THREE.CanvasTexture(labelCanvas);
      const labelMaterial = new THREE.MeshBasicMaterial({
        map: labelTexture,
        transparent: true
      });
      
      const labelGeometry = new THREE.PlaneGeometry(buttonWidth * 0.8, buttonHeight * 0.8);
      const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
      labelMesh.position.z = 0.026;
      buttonGroup.add(labelMesh);
      
      buttonGroup.position.set(
        startX + col * (buttonWidth + buttonSpacing),
        startY - row * (buttonHeight + buttonSpacing),
        0.05
      );
      
      group.add(buttonGroup);
      
      buttons.push({
        group: buttonGroup,
        mesh: buttonMesh,
        label: label,
        value: label,
        type: config.type,
        isHovered: false,
        isSelected: false
      });
    });
    
    return {
      group: group,
      config: config,
      buttons: buttons,
      panelMesh: panelMesh,
      border: border
    };
  }
  
  createTextCanvas(text, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const context = canvas.getContext('2d');
    context.fillStyle = 'rgba(0, 0, 0, 0)';
    context.fillRect(0, 0, width, height);
    
    context.font = `${height * 0.4}px Arial`;
    context.fillStyle = '#00ffff';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, width / 2, height / 2);
    
    return canvas;
  }
  
  handleRaycast(raycaster) {
    const intersectedButtons = [];
    
    this.panels.forEach(panel => {
      panel.buttons.forEach(button => {
        const intersects = raycaster.intersectObject(button.mesh);
        
        if (intersects.length > 0) {
          intersectedButtons.push({ button, distance: intersects[0].distance });
        }
        
        this.updateButtonState(button, false);
      });
    });
    
    if (intersectedButtons.length > 0) {
      intersectedButtons.sort((a, b) => a.distance - b.distance);
      const closestButton = intersectedButtons[0].button;
      this.updateButtonState(closestButton, true);
      return closestButton;
    }
    
    return null;
  }
  
  updateButtonState(button, isHovered) {
    button.isHovered = isHovered;
    
    if (isHovered) {
      button.mesh.material.emissiveIntensity = 0.6;
      button.mesh.material.color.setHex(0x6666ff);
      button.group.scale.setScalar(1.1);
    } else if (button.isSelected) {
      button.mesh.material.emissiveIntensity = 0.5;
      button.mesh.material.color.setHex(0x00ff00);
      button.group.scale.setScalar(1.05);
    } else {
      button.mesh.material.emissiveIntensity = 0.3;
      button.mesh.material.color.setHex(0x4444aa);
      button.group.scale.setScalar(1);
    }
  }
  
  selectButton(button) {
    this.panels.forEach(panel => {
      panel.buttons.forEach(b => {
        if (b.type === button.type) {
          b.isSelected = false;
          this.updateButtonState(b, b.isHovered);
        }
      });
    });
    
    button.isSelected = true;
    this.updateButtonState(button, button.isHovered);
    
    return {
      type: button.type,
      value: button.value
    };
  }
  
  update(deltaTime) {
    this.panels.forEach(panel => {
      panel.group.rotation.y = Math.sin(Date.now() * 0.001) * 0.05;
      
      panel.border.material.color.setHSL(
        (Date.now() * 0.0001) % 1,
        1,
        0.5
      );
    });
  }
  
  setVisible(visible) {
    this.panels.forEach(panel => {
      panel.group.visible = visible;
    });
  }
  
  dispose() {
    this.panels.forEach(panel => {
      panel.group.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (child.material.map) child.material.map.dispose();
          child.material.dispose();
        }
      });
      
      this.scene.remove(panel.group);
    });
  }
}