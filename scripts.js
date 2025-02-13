let nodes = [];
let selectedNode = null;
let arcos = [];
let arcoDirigido = false;
let peso = 0;
let tempNode = null;
let moveMode = false;
let deleteMode = false;
let draggingNode = null;

function getNodeAt(x, y, nodes) {
  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index];
    const a = x - node.x;
    const b = y - node.y;
    const c = Math.sqrt(a * a + b * b);
    if (c < 90) {
      return node;
    }
  }
  return null;
}

function drawNodes(ctx, nodes) {
  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index];
    if (node === selectedNode) {
      ctx.strokeStyle = "#FF0000";
    } else {
      ctx.strokeStyle = "#000000";
    }
    ctx.beginPath();
    ctx.lineWidth = 4;
    ctx.fillStyle = "#FFFFFF";
    ctx.arc(node.x, node.y, 40, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.fill();
    if (node === selectedNode) {
      ctx.fillStyle = "#FF0000";
    } else {
      ctx.fillStyle = "#000000";
    }
    ctx.font = "30px Arial";
    ctx.fillText(index, node.x - 5, node.y + 5);
  }
}

function hasBidirectionalConnection(arco, arcos) {
  return arcos.some(a => 
    a !== arco && 
    ((a.node1 === arco.node1 && a.node2 === arco.node2) ||
     (a.node1 === arco.node2 && a.node2 === arco.node1))
  );
}

function drawArcos(ctx, arcos) {
  const radius = 40;

  for (let index = 0; index < arcos.length; index++) {
    const arco = arcos[index];
    const isBidirectional = hasBidirectionalConnection(arco, arcos);
    
    let angle = Math.atan2(arco.node2.y - arco.node1.y, arco.node2.x - arco.node1.x);
    
    // Calcular puntos de inicio y fin
    let startX = arco.node1.x;
    let startY = arco.node1.y;
    let endX = arco.node2.x;
    let endY = arco.node2.y;
    
    // Dibujar línea curva si es bidireccional
    ctx.beginPath();
    if (isBidirectional) {
      // Calcular punto de control para la curva
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      const dx = endX - startX;
      const dy = endY - startY;
      const normalX = -dy;
      const normalY = dx;
      const length = Math.sqrt(normalX * normalX + normalY * normalY);
      const curveOffset = 50; // Ajusta este valor para cambiar la curvatura
      
      const controlX = midX + (normalX / length) * curveOffset;
      const controlY = midY + (normalY / length) * curveOffset;
      
      // Ajustar puntos de inicio y fin para el radio del nodo
      const startAngle = Math.atan2(controlY - startY, controlX - startX);
      const endAngle = Math.atan2(controlY - endY, controlX - endX);
      
      startX = arco.node1.x + radius * Math.cos(startAngle);
      startY = arco.node1.y + radius * Math.sin(startAngle);
      endX = arco.node2.x + radius * Math.cos(endAngle);
      endY = arco.node2.y + radius * Math.sin(endAngle);
      
      // Dibujar la curva
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(controlX, controlY, endX, endY);
      
      // Calcular ángulo para la flecha en la curva
      if (arco.dirigido) {
        const t = 0.95; // Punto donde se dibujará la flecha (0-1)
        const arrowX = (1-t)*(1-t)*startX + 2*(1-t)*t*controlX + t*t*endX;
        const arrowY = (1-t)*(1-t)*startY + 2*(1-t)*t*controlY + t*t*endY;
        
        // Calcular la tangente en ese punto
        const tangentX = 2*(1-t)*(controlX-startX) + 2*t*(endX-controlX);
        const tangentY = 2*(1-t)*(controlY-startY) + 2*t*(endY-controlY);
        const arrowAngle = Math.atan2(tangentY, tangentX);
        
        // Dibujar flecha
        const arrowSize = 10;
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
          arrowX - arrowSize * Math.cos(arrowAngle - Math.PI / 6),
          arrowY - arrowSize * Math.sin(arrowAngle - Math.PI / 6)
        );
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
          arrowX - arrowSize * Math.cos(arrowAngle + Math.PI / 6),
          arrowY - arrowSize * Math.sin(arrowAngle + Math.PI / 6)
        );
      }
    } else {
      // Si no es bidireccional, dibuja línea recta como antes
      startX = arco.node1.x + radius * Math.cos(angle);
      startY = arco.node1.y + radius * Math.sin(angle);
      endX = arco.node2.x - radius * Math.cos(angle);
      endY = arco.node2.y - radius * Math.sin(angle);
      
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      
      if (arco.dirigido) {
        let arrowSize = 10;
        ctx.lineTo(endX - arrowSize * Math.cos(angle - Math.PI / 6),
                  endY - arrowSize * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - arrowSize * Math.cos(angle + Math.PI / 6),
                  endY - arrowSize * Math.sin(angle + Math.PI / 6));
      }
    }
    
    ctx.strokeStyle = "#000000";
    ctx.stroke();
    
    // Dibujar el peso
    if (arco.peso !== undefined && arco.peso !== 0) {
      ctx.font = "20px Arial";
      
      let textX, textY;
      if (isBidirectional) {
        // Posicionar el peso en la curva
        const midT = 0.5;
        textX = (1-midT)*(1-midT)*startX + 2*(1-midT)*midT*((startX + endX)/2 + (endY - startY)/4) + midT*midT*endX;
        textY = (1-midT)*(1-midT)*startY + 2*(1-midT)*midT*((startY + endY)/2 - (endX - startX)/4) + midT*midT*endY;
      } else {
        // Posicionar el peso en la línea recta
        textX = (startX + endX) / 2;
        textY = (startY + endY) / 2 - 10;
      }
      
      const padding = 4;
      const textWidth = ctx.measureText(arco.peso.toString()).width;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(textX - textWidth/2 - padding,
                  textY - 10 - padding,
                  textWidth + padding*2,
                  20 + padding*2);
      
      ctx.fillStyle = "#000000";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(arco.peso.toString(), textX, textY);
    }
  }
}

function showModal() {
  document.getElementById("modal").style.display = "flex";
}

function hideModal() {
  document.getElementById("modal").style.display = "none";
}

window.onload = async () => {
  var canvas = document.getElementById("myCanvas");
  var context = canvas.getContext("2d");
  
  // Crear contenedor para botones
  const buttonContainer = document.createElement('div');
  buttonContainer.style.margin = '10px';
  canvas.parentNode.insertBefore(buttonContainer, canvas);
  
  // Botón de mover
  const moveButton = document.createElement('button');
  moveButton.textContent = 'Modo Mover';
  moveButton.style.margin = '0 10px 0 0';
  moveButton.style.padding = '5px 10px';
  buttonContainer.appendChild(moveButton);
  
  // Botón de eliminar
  const deleteButton = document.createElement('button');
  deleteButton.textContent = 'Modo Eliminar';
  deleteButton.style.padding = '5px 10px';
  buttonContainer.appendChild(deleteButton);
  
  moveButton.addEventListener('click', () => {
    moveMode = !moveMode;
    if (moveMode) {
      deleteMode = false;
      deleteButton.textContent = 'Modo Eliminar';
      deleteButton.style.backgroundColor = '';
    }
    moveButton.textContent = moveMode ? 'Desactivar Mover' : 'Modo Mover';
    moveButton.style.backgroundColor = moveMode ? '#ff9999' : '';
    selectedNode = null;
    tempNode = null;
  });
  
  deleteButton.addEventListener('click', () => {
    deleteMode = !deleteMode;
    if (deleteMode) {
      moveMode = false;
      moveButton.textContent = 'Modo Mover';
      moveButton.style.backgroundColor = '';
    }
    deleteButton.textContent = deleteMode ? 'Desactivar Eliminar' : 'Modo Eliminar';
    deleteButton.style.backgroundColor = deleteMode ? '#ff9999' : '';
    selectedNode = null;
    tempNode = null;
  });

  canvas.addEventListener("mousedown", (e) => {
    if (moveMode) {
      const x = e.clientX - canvas.offsetLeft;
      const y = e.clientY - canvas.offsetTop;
      draggingNode = getNodeAt(x, y, nodes);
    }
  });

  canvas.addEventListener("mousemove", (e) => {
    if (moveMode && draggingNode) {
      draggingNode.x = e.clientX - canvas.offsetLeft;
      draggingNode.y = e.clientY - canvas.offsetTop;
      
      context.clearRect(0, 0, canvas.width, canvas.height);
      drawArcos(context, arcos);
      drawNodes(context, nodes);
    }
  });

  canvas.addEventListener("mouseup", () => {
    draggingNode = null;
  });

  canvas.addEventListener("click", (e) => {
    if (moveMode) return;
    
    let x = e.clientX - canvas.offsetLeft;
    let y = e.clientY - canvas.offsetTop;
    let clickedNode = getNodeAt(x, y, nodes);
    
    if (deleteMode) {
      if (clickedNode !== null) {
        // Eliminar el nodo y sus conexiones
        const nodeIndex = nodes.indexOf(clickedNode);
        nodes.splice(nodeIndex, 1);
        // Eliminar todos los arcos conectados a este nodo
        arcos = arcos.filter(arco => arco.node1 !== clickedNode && arco.node2 !== clickedNode);
      } else {
        // Verificar si se hizo clic en un arco
        let arcToDelete = null;
        let minDistance = Infinity;
        
        // Primera pasada: encontrar la línea más cercana
        for (let i = 0; i < arcos.length; i++) {
          const arco = arcos[i];
          // Calcular la distancia del punto a la línea o curva
          let distance;
          
          if (hasBidirectionalConnection(arco, arcos)) {
            // Para líneas curvas, calculamos múltiples puntos en la curva
            const steps = 20;
            let minCurveDistance = Infinity;
            
            for (let t = 0; t <= 1; t += 1/steps) {
              // Punto medio para el control de la curva
              const midX = (arco.node1.x + arco.node2.x) / 2;
              const midY = (arco.node1.y + arco.node2.y) / 2;
              
              // Offset para la curva
              const dx = arco.node2.x - arco.node1.x;
              const dy = arco.node2.y - arco.node1.y;
              const normalX = -dy;
              const normalY = dx;
              const length = Math.sqrt(normalX * normalX + normalY * normalY);
              const curveOffset = 50;
              
              const controlX = midX + (normalX / length) * curveOffset;
              const controlY = midY + (normalY / length) * curveOffset;
              
              // Calcular punto en la curva
              const curveX = Math.pow(1-t, 2) * arco.node1.x + 
                           2 * (1-t) * t * controlX + 
                           Math.pow(t, 2) * arco.node2.x;
              const curveY = Math.pow(1-t, 2) * arco.node1.y + 
                           2 * (1-t) * t * controlY + 
                           Math.pow(t, 2) * arco.node2.y;
              
              // Distancia del punto al click
              const curveDistance = Math.sqrt(
                Math.pow(x - curveX, 2) + 
                Math.pow(y - curveY, 2)
              );
              
              minCurveDistance = Math.min(minCurveDistance, curveDistance);
            }
            
            distance = minCurveDistance;
          } else {
            // Para líneas rectas, usamos la distancia al segmento
            const A = { x: arco.node1.x, y: arco.node1.y };
            const B = { x: arco.node2.x, y: arco.node2.y };
            const P = { x: x, y: y };
            
            const AB = { x: B.x - A.x, y: B.y - A.y };
            const AP = { x: P.x - A.x, y: P.y - A.y };
            const ab2 = AB.x * AB.x + AB.y * AB.y;
            const ap_ab = AP.x * AB.x + AP.y * AB.y;
            let t = ap_ab / ab2;
            t = Math.max(0, Math.min(1, t));
            
            const closest = {
              x: A.x + AB.x * t,
              y: A.y + AB.y * t
            };
            
            distance = Math.sqrt(
              Math.pow(P.x - closest.x, 2) + 
              Math.pow(P.y - closest.y, 2)
            );
          }
          
          // Si este arco está más cerca que el anterior más cercano
          if (distance < minDistance && distance < 20) {
            minDistance = distance;
            arcToDelete = i;
          }
        }
        
        // Si encontramos un arco para eliminar
        if (arcToDelete !== null) {
          // Eliminar solo el arco seleccionado, manteniendo su par bidireccional si existe
          arcos.splice(arcToDelete, 1);
        }
      }
      
      // Actualizar el canvas
      context.clearRect(0, 0, canvas.width, canvas.height);
      drawArcos(context, arcos);
      drawNodes(context, nodes);
      return;
    }
    
    if (clickedNode !== null) {
      if (selectedNode === null) {
        selectedNode = clickedNode;
      } else {
        tempNode = clickedNode;
      }
    } else if (selectedNode === null) {
      nodes.push({ x, y });
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    
    if (selectedNode !== null && tempNode !== null) {
      peso = 0;
      arcoDirigido = false;
      showModal();
    }

    drawArcos(context, arcos);
    drawNodes(context, nodes);
  });

  // Modal buttons
  document.getElementById("dirigido-btn").addEventListener("click", () => {
    arcoDirigido = true;
    peso = parseInt(document.getElementById("peso-input").value) || 0;
    arcos.push({ 
      node1: selectedNode, 
      node2: tempNode, 
      dirigido: arcoDirigido, 
      peso: peso 
    });
    selectedNode = null;
    tempNode = null;
    hideModal();
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawArcos(context, arcos);
    drawNodes(context, nodes);
  });

  document.getElementById("no-dirigido-btn").addEventListener("click", () => {
    arcoDirigido = false;
    peso = parseInt(document.getElementById("peso-input").value) || 0;
    arcos.push({ 
      node1: selectedNode, 
      node2: tempNode, 
      dirigido: arcoDirigido, 
      peso: peso 
    });
    selectedNode = null;
    tempNode = null;
    hideModal();
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawArcos(context, arcos);
    drawNodes(context, nodes);
  });

  document.getElementById("cancelar-btn").addEventListener("click", () => {
    selectedNode = null;
    tempNode = null;
    hideModal();
  });
};