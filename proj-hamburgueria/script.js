// Lista de produtos (poderia vir de um servidor, aqui é fixo pra exemplo)
const products = [
  {
    id: 1,
    name: "X-Burger",
    description: "Pão brioche, 180g de carne, queijo, alface, tomate e molho da casa.",
    price: 28.9,
    category: "burgers",
    image: "img/x-burger.jpeg"
  },
  {
    id: 2,
    name: "X-Bacon",
    description: "Carne artesanal, queijo, muito bacon crocante e molho especial.",
    price: 32.5,
    category: "burgers",
    image: "img/x-bacon.jpeg"
  },
  {
    id: 3,
    name: "Combo Clássico",
    description: "X-Burger + batata frita + refrigerante lata.",
    price: 39.9,
    category: "combos",
    image: "img/combo-class.jpeg"
  },
  {
    id: 4,
    name: "Combo Duplo",
    description: "Dois hambúrgueres artesanais + batata grande + 2 refri lata.",
    price: 64.9,
    category: "combos",
    image: "img/combo-duplo.jpeg"
  },
  {
    id: 5,
    name: "Refrigerante Lata",
    description: "Coca, Fanta, Sprit. 350ml.",
    price: 6.0,
    category: "drinks",
    image: "img/refrigerante.webp"
  },
  {
    id: 6,
    name: "Milkshake Chocolate",
    description: "Milkshake cremoso de chocolate 500ml.",
    price: 18.0,
    category: "drinks",
    image: "img/milk-choco.jpeg"
  },
  {
    id: 7,
    name: "Brownie com Sorvete",
    description: "Brownie de chocolate artesanal com bola de sorvete de creme.",
    price: 19.9,
    category: "desserts",
    image: "img/sobremesa.jpeg"
  },
  {
    id: 7,
    name: "Torta de Bonoffee",
    description: "Torta de origem inglesa com banana, caramelo (toffee) e creme.",
    price: 29.9,
    category: "desserts",
    image: "img/banoffee.jpeg"
  },
  {
    id: 7,
    name: "Banana Split",
    description: "Sobremesa americana, com banana e tres bolas de sorvete.",
    price: 20.9,
    category: "desserts",
    image: "img/banana.jpeg"
  },
  {
    id: 7,
    name: "Churros com Nutella",
    description: "Massa de churros recheado com nutella e canela.",
    price: 14.99,
    category: "desserts",
    image: "img/churros.jpeg"
  }
];

const DELIVERY_FEE = 6.0;

const productListEl = document.getElementById("product-list");
const categoryButtons = document.querySelectorAll(".category-button");
const cartItemsEl = document.getElementById("cart-items");
const subtotalEl = document.getElementById("subtotal-value");
const deliveryEl = document.getElementById("delivery-value");
const totalEl = document.getElementById("total-value");
const checkoutBtn = document.getElementById("checkout-btn");
const clearCartBtn = document.getElementById("clear-cart-btn");
const scrollMenuBtn = document.getElementById("scroll-menu-btn");
const menuSection = document.getElementById("menu");

// Objeto carrinho: { idProduto: { product, quantity } }
const cart = {};

function formatPrice(value) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function renderProducts(category = "all") {
  productListEl.innerHTML = "";

  const filtered = category === "all"
    ? products
    : products.filter(p => p.category === category);

  filtered.forEach(product => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="product-img" />
      <h3 class="product-title">${product.name}</h3>
      <p class="product-desc">${product.description}</p>
      <div class="product-footer">
        <span class="product-price">${formatPrice(product.price)}</span>
        <button class="add-to-cart-btn" data-id="${product.id}">Adicionar</button>
      </div>
    `;
    productListEl.appendChild(card);
  });
}

function updateCart() {
  cartItemsEl.innerHTML = "";

  const ids = Object.keys(cart);

  if (ids.length === 0) {
    const empty = document.createElement("p");
    empty.className = "cart-empty";
    empty.textContent = "Seu carrinho está vazio 😢";
    cartItemsEl.appendChild(empty);

    subtotalEl.textContent = formatPrice(0);
    totalEl.textContent = formatPrice(0);
    deliveryEl.textContent = formatPrice(DELIVERY_FEE);
    checkoutBtn.disabled = true;
    clearCartBtn.disabled = true;
    return;
  }

  let subtotal = 0;

  ids.forEach(id => {
    const { product, quantity } = cart[id];
    const itemTotal = product.price * quantity;
    subtotal += itemTotal;

    const itemEl = document.createElement("div");
    itemEl.className = "cart-item";
    itemEl.innerHTML = `
      <div class="cart-item-info">
        <p class="cart-item-title">${product.name}</p>
        <p class="cart-item-price">${quantity} x ${formatPrice(product.price)}</p>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn" data-action="decrease" data-id="${product.id}">-</button>
        <span class="qty-value">${quantity}</span>
        <button class="qty-btn" data-action="increase" data-id="${product.id}">+</button>
        <button class="remove-item-btn" data-action="remove" data-id="${product.id}">remover</button>
      </div>
    `;
    cartItemsEl.appendChild(itemEl);
  });

  const total = subtotal + DELIVERY_FEE;

  subtotalEl.textContent = formatPrice(subtotal);
  deliveryEl.textContent = formatPrice(DELIVERY_FEE);
  totalEl.textContent = formatPrice(total);

  checkoutBtn.disabled = false;
  clearCartBtn.disabled = false;
}

function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  if (!cart[productId]) {
    cart[productId] = { product, quantity: 1 };
  } else {
    cart[productId].quantity += 1;
  }
  updateCart();
}

function changeQuantity(productId, action) {
  const item = cart[productId];
  if (!item) return;

  if (action === "increase") {
    item.quantity += 1;
  } else if (action === "decrease") {
    item.quantity -= 1;
    if (item.quantity <= 0) {
      delete cart[productId];
    }
  }
  updateCart();
}

function removeFromCart(productId) {
  delete cart[productId];
  updateCart();
}

function clearCart() {
  Object.keys(cart).forEach(id => delete cart[id]);
  updateCart();
}

function handleCategoryClick(e) {
  const button = e.target.closest(".category-button");
  if (!button) return;

  const category = button.dataset.category;

  categoryButtons.forEach(btn => btn.classList.remove("active"));
  button.classList.add("active");

  renderProducts(category);
}

// Enviar pedido via WhatsApp (simples)
function checkout() {
  const ids = Object.keys(cart);
  if (ids.length === 0) return;

  let message = "Olá, gostaria de fazer o seguinte pedido:%0A%0A";
  let subtotal = 0;

  ids.forEach(id => {
    const { product, quantity } = cart[id];
    const itemTotal = product.price * quantity;
    subtotal += itemTotal;
    message += `• ${quantity}x ${product.name} - ${formatPrice(itemTotal)}%0A`;
  });

  const total = subtotal + DELIVERY_FEE;

  message += `%0ASubtotal: ${formatPrice(subtotal)}`;
  message += `%0AEntrega: ${formatPrice(DELIVERY_FEE)}`;
  message += `%0ATotal: ${formatPrice(total)}`;

  // Coloque o número do WhatsApp da hamburgueria aqui (somente números com DDD e DDI se quiser)
  const phoneNumber = "5599999999999"; // EXEMPLO
  const url = `https://wa.me/${phoneNumber}?text=${message}`;

  window.open(url, "_blank");
}

// Eventos
document.addEventListener("click", e => {
  // Adicionar ao carrinho
  if (e.target.matches(".add-to-cart-btn")) {
    const id = Number(e.target.dataset.id);
    addToCart(id);
  }

  // Controle de quantidade e remover
  if (e.target.matches(".qty-btn")) {
    const id = Number(e.target.dataset.id);
    const action = e.target.dataset.action;
    changeQuantity(id, action);
  }

  if (e.target.matches(".remove-item-btn")) {
    const id = Number(e.target.dataset.id);
    removeFromCart(id);
  }

  if (e.target.matches(".category-button")) {
    handleCategoryClick(e);
  }
});

// Scroll para o cardápio
scrollMenuBtn.addEventListener("click", () => {
  menuSection.scrollIntoView({ behavior: "smooth" });
});

// Botões do carrinho
checkoutBtn.addEventListener("click", checkout);
clearCartBtn.addEventListener("click", clearCart);

// Inicialização
renderProducts("all");
updateCart();
