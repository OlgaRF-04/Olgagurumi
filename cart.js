// --- CARRITO DE COMPRAS ---
let carrito = JSON.parse(localStorage.getItem('olgagurumi_carrito')) || [];

function actualizarBadge() {
    const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);
    document.querySelectorAll('.cart-badge').forEach(badge => {
        badge.innerText = totalItems;
        badge.style.display = totalItems > 0 ? 'inline-block' : 'none';
    });
}

function abrirCarrito() {
    document.getElementById('cart-sidebar').classList.add('open');
    document.getElementById('cart-overlay').style.display = 'block';
    renderCarrito();
    document.body.style.overflowY = 'hidden';
}

function cerrarCarrito() {
    document.getElementById('cart-sidebar').classList.remove('open');
    document.getElementById('cart-overlay').style.display = 'none';
    document.body.style.overflowY = 'auto';
}

function cambiarCantidadModal(delta) {
    const input = document.getElementById('modal-cantidad');
    let val = parseInt(input.value) + delta;
    if (isNaN(val) || val < 1) val = 1;
    input.value = val;
}

let amigurumiSeleccionado = null;

// Reemplazar la función global abrirDetalles que viene de index y catalogo
const oldAbrirDetalles = window.abrirDetalles;
window.abrirDetalles = function (index) {
    const ami = window.catalogoAmigurumis[index];
    amigurumiSeleccionado = ami;
    document.getElementById('modal-img').src = ami.imagen_url || 'https://via.placeholder.com/250';
    document.getElementById('modal-titulo').innerText = ami.nombre;
    document.getElementById('modal-precio').innerText = `S/ ${parseFloat(ami.precio).toFixed(2)}`;
    document.getElementById('modal-desc').innerText = ami.descripcion || 'Confeccionado a mano con hilos hipoalergénicos de alta calidad. Ideal para regalar mucho amor.';
    
    // Restablecer cantidad
    const inputCantidad = document.getElementById('modal-cantidad');
    if (inputCantidad) inputCantidad.value = 1;
    
    document.getElementById('modal-detalles').style.display = 'flex';
    document.body.style.overflowY = 'hidden';
};

window.agregarAlCarrito = function() {
    if (!amigurumiSeleccionado) return;
    const inputCantidad = document.getElementById('modal-cantidad');
    const cantidad = inputCantidad ? parseInt(inputCantidad.value) : 1;
    
    const index = carrito.findIndex(item => item.id === amigurumiSeleccionado.id);
    if (index !== -1) {
        carrito[index].cantidad += isNaN(cantidad) ? 1 : cantidad;
    } else {
        carrito.push({
            id: amigurumiSeleccionado.id,
            nombre: amigurumiSeleccionado.nombre,
            precio: parseFloat(amigurumiSeleccionado.precio),
            imagen: amigurumiSeleccionado.imagen_url,
            cantidad: isNaN(cantidad) ? 1 : cantidad
        });
    }
    
    guardarCarrito();
    window.cerrarDetalles();
    abrirCarrito();
};

function guardarCarrito() {
    localStorage.setItem('olgagurumi_carrito', JSON.stringify(carrito));
    actualizarBadge();
}

window.modificarCantidadCarrito = function(id, delta) {
    const index = carrito.findIndex(item => item.id === id);
    if (index !== -1) {
        carrito[index].cantidad += delta;
        if (carrito[index].cantidad < 1) {
            carrito[index].cantidad = 1;
        }
        guardarCarrito();
        renderCarrito();
    }
};

window.eliminarDelCarrito = function(id) {
    carrito = carrito.filter(item => item.id !== id);
    guardarCarrito();
    renderCarrito();
};

function renderCarrito() {
    const container = document.getElementById('cart-items-container');
    const subtotalesElems = document.querySelectorAll('.cart-subtotal-val');
    
    container.innerHTML = '';
    let subtotal = 0;
    
    if (carrito.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #888; margin-top: 50px;">Tu carrito está vacío</p>';
    } else {
        carrito.forEach(item => {
            subtotal += item.precio * item.cantidad;
            const div = document.createElement('div');
            div.className = 'cart-item';
            div.innerHTML = `
                <img src="${item.imagen || 'https://via.placeholder.com/80'}" alt="${item.nombre}">
                <div class="cart-item-info">
                    <h4 class="cart-item-title">${item.nombre}</h4>
                    <div class="cart-item-price">S/ ${item.precio.toFixed(2)}</div>
                    <div class="cart-controls">
                        <button class="cart-remove" onclick="eliminarDelCarrito(${item.id})">Remover</button>
                        <div class="cart-quantity">
                            <button onclick="modificarCantidadCarrito(${item.id}, -1)">-</button>
                            <input type="number" readonly value="${item.cantidad}">
                            <button onclick="modificarCantidadCarrito(${item.id}, 1)">+</button>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(div);
        });
    }
    
    subtotalesElems.forEach(el => el.innerText = `S/ ${subtotal.toFixed(2)}`);
}

window.enviarPedidoWhatsapp = function() {
    if (carrito.length === 0) return alert('El carrito está vacío');
    
    let mensaje = "Hola Olga Gurumi, quiero hacer el siguiente pedido:\n\n";
    let total = 0;
    
    carrito.forEach(item => {
        const sub = item.precio * item.cantidad;
        total += sub;
        mensaje += `- ${item.cantidad}x ${item.nombre} (S/ ${item.precio.toFixed(2)} c/u) = S/ ${sub.toFixed(2)}\n`;
    });
    
    mensaje += `\n*Total a pagar: S/ ${total.toFixed(2)}*`;
    
    const msgEncoded = encodeURIComponent(mensaje);
    window.open(`https://wa.me/51922818179?text=${msgEncoded}`, '_blank');
};

// Crear y añadir el HTML del carrito dinámicamente
function inyectarHTMLCarrito() {
    if(document.getElementById('cart-sidebar')) return; // Ya existe
    
    const htmlCarrito = `
        <div id="cart-overlay" class="cart-overlay" onclick="cerrarCarrito()"></div>
        <div id="cart-sidebar" class="cart-sidebar">
            <div class="cart-header">
                <h3 style="margin: 0; color: #d87093;">Carrito de Compras</h3>
                <button onclick="cerrarCarrito()" style="background: none; border: none; font-size: 20px; cursor: pointer;">✕</button>
            </div>
            <div id="cart-items-container" class="cart-items">
                <!-- Los items del carrito se cargarán aquí -->
            </div>
            <div class="cart-footer">
                <div class="cart-total">
                    <span>Subtotal</span>
                    <span class="cart-subtotal-val">S/ 0.00</span>
                </div>
                <button class="btn-checkout" onclick="enviarPedidoWhatsapp()">Comprar Subtotal <span class="cart-subtotal-val">S/ 0.00</span></button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', htmlCarrito);
}

document.addEventListener('DOMContentLoaded', () => {
    inyectarHTMLCarrito();
    actualizarBadge();
});
