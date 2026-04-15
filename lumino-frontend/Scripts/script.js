function showTemplates(){
  document.getElementById('templates').style.display = 'grid';
}

function selectTemplate(type){
  document.getElementById('formSection').style.display = 'block';
}

function generateSite(){
  const name = document.getElementById('name').value;
  const desc = document.getElementById('desc').value;
  const contact = document.getElementById('contact').value;

  document.getElementById('pName').innerText = name;
  document.getElementById('pDesc').innerText = desc;
  document.getElementById('pContact').innerText = contact;

  document.getElementById('preview').style.display = 'block';
  window.scrollTo(0, document.body.scrollHeight);
}


//sales
 let sales = [];
 let editIndex = -1;

    // Load sales from localStorage
    window.onload = function() {
      const savedSales = localStorage.getItem('salesData');
      if (savedSales) {
        sales = JSON.parse(savedSales);
        renderSales();
      }
    }
    function addSale() {
      const productInput = document.getElementById('product');
      const amountInput = document.getElementById('amount');
      const product = productInput.value.trim();
      const amount = parseFloat(amountInput.value);
      if (!product || isNaN(amount) || amount <= 0) {
        alert('Please enter a valid product name and amount.');
        return;
      }

      if (editIndex === -1){
      //add new sale
      const date = new Date().toISOString();
      sales.push({product, amount, date});
      }
      else {
      //update existng sale
      sales[editIndex].product = product;
      sales[editIndex].amount = amount;
      editIndex = -1
      }

      saveAndRender();

      productInput.value = '';
      amountInput.value = '';
      productInput.focus();

      //const date = new Date().toISOString(); // store full timestamp
      //sales.push({ product, amount, date });
      //saveAndRender();
      // Clear inputs
      //productInput.value = '';
      //amountInput.value = '';
      //.focus();
    }

  function editSale(index){
    const sale = sales[index];

    document.getElementById('product').value = sale.product
    document.getElementById('amount').value = sale.amount

    editIndex = index;
  }  






    function deleteSale(index) {
      sales.splice(index, 1);
      saveAndRender();
    }
    function saveAndRender() {
      localStorage.setItem('salesData', JSON.stringify(sales));
      renderSales();
    }
    function renderSales() {
      const tableBody = document.querySelector('#salesTable tbody');
      tableBody.innerHTML = '';
      const filter = document.getElementById('filter').value;
      let total = 0;
      const now = new Date();

      sales.forEach((sale, index) => {
        const saleDate = new Date(sale.date);
        let include = false;

        switch (filter) {
          case 'today':
            include = saleDate.toDateString() === now.toDateString();
            break;
          case 'week':
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay()); // Sunday start
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            include = saleDate >= weekStart && saleDate <= weekEnd;
            break;
          case 'month':
            include = saleDate.getMonth() === now.getMonth() &&
                      saleDate.getFullYear() === now.getFullYear();
            break;

          default:
            include = true;
        }
        if (include) {
          const row = document.createElement('tr');
          row.innerHTML = `
          <td>${saleDate.toLocaleString('en-NG', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })}</td>
          <td>${sale.product}</td>
          <td>${sale.amount.toLocaleString('en-NG', {
            style: 'currency',
            currency: 'NGN'
          })}</td>
          <td>
          <button class="delete-btn" onclick="editSale(${index})">Edit</button>
          <button class="delete-btn" onclick="deleteSale(${index})">Delete</button>
          </td>
          `;
          
          tableBody.appendChild(row);
          total += sale.amount;
        }
      });
      
      document.getElementById('totalSales').innerText =
        `Total Sales: ${total.toLocaleString('en-NG', {
          style: 'currency',
          currency: 'NGN'
        })}`;
function updateSummary() {
  let today = 0, week = 0, month = 0;
  const now = new Date();

  sales.forEach(sale => {
    const d = new Date(sale.date);

    // Today
    if (d.toDateString() === now.toDateString()) {
      today += sale.amount;
    }

    // Week
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());

    if (d >= weekStart) {
      week += sale.amount;
    }

    // Month
    if (
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    ) {
      month += sale.amount;
    }
  });

  document.getElementById('todayCard').innerText =
    `Today: ₦${today.toLocaleString()}`;

  document.getElementById('weekCard').innerText =
    `Week: ₦${week.toLocaleString()}`;

  document.getElementById('monthCard').innerText =
    `Month: ₦${month.toLocaleString()}`;
}

}