let schedule = [];

function formatCurrency(amount, currencyCode) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

function calculateEMI() {
    // Get input values
    const principal = parseFloat(document.getElementById('principal').value);
    const annualRate = parseFloat(document.getElementById('rate').value);
    const tenureInput = parseFloat(document.getElementById('tenure').value);
    const unit = document.getElementById('tenure-unit').value;
    const currency = document.getElementById('currency').value;

    // Error handling
    const errorElement = document.getElementById('error-message');
    if (isNaN(principal) || isNaN(annualRate) || isNaN(tenureInput) ||
        principal <= 0 || annualRate <= 0 || tenureInput <= 0) {
        errorElement.textContent = 'Please enter valid positive numbers for all fields';
        errorElement.style.display = 'block';
        document.getElementById('results').style.display = 'none';
        return;
    }

    if (unit === 'months' && !Number.isInteger(tenureInput)) {
        errorElement.textContent = 'Loan tenure in months must be a whole number';
        errorElement.style.display = 'block';
        document.getElementById('results').style.display = 'none';
        return;
    }

    errorElement.style.display = 'none';

    // Calculate values
    const monthlyRate = annualRate / 12 / 100;
    const months = unit === 'years' ? tenureInput * 12 : tenureInput;

    // EMI calculation
    const emi = principal * monthlyRate * 
              Math.pow(1 + monthlyRate, months) / 
              (Math.pow(1 + monthlyRate, months) - 1);

    const totalPayment = emi * months;
    const totalInterest = totalPayment - principal;

    // Generate payment schedule
    schedule = [];
    let remainingPrincipal = principal;
    for (let month = 1; month <= months; month++) {
        const interest = remainingPrincipal * monthlyRate;
        const principalPayment = emi - interest;
        remainingPrincipal -= principalPayment;
        
        // Handle floating point precision issues
        if (month === months) {
            remainingPrincipal = 0;
        }

        schedule.push({
            month,
            payment: emi,
            principal: principalPayment,
            interest,
            remaining: remainingPrincipal > 0 ? remainingPrincipal : 0
        });
    }

    // Display results
    document.getElementById('results').style.display = 'block';
    document.getElementById('emi').textContent = formatCurrency(emi, currency);
    document.getElementById('total-payment').textContent = formatCurrency(totalPayment, currency);
    document.getElementById('total-interest').textContent = formatCurrency(totalInterest, currency);

    // Update payment schedule
    const scheduleBody = document.getElementById('schedule-body');
    scheduleBody.innerHTML = '';
    schedule.forEach(entry => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${entry.month}</td>
            <td>${formatCurrency(entry.payment, currency)}</td>
            <td>${formatCurrency(entry.principal, currency)}</td>
            <td>${formatCurrency(entry.interest, currency)}</td>
            <td>${formatCurrency(entry.remaining, currency)}</td>
        `;
        scheduleBody.appendChild(row);
    });

    // Show export button
    document.getElementById('export-csv').style.display = 'inline-block';
}

function toggleSchedule() {
    const container = document.getElementById('schedule-container');
    const toggleButton = document.getElementById('toggle-schedule');
    if (container.style.display === 'none') {
        container.style.display = 'block';
        toggleButton.textContent = 'Hide Payment Schedule';
    } else {
        container.style.display = 'none';
        toggleButton.textContent = 'Show Payment Schedule';
    }
}

function exportCSV() {
    const currency = document.getElementById('currency').value;
    const rows = [
        ['Month', 'Payment', 'Principal', 'Interest', 'Remaining Balance']
    ];
    
    schedule.forEach(entry => {
        rows.push([
            entry.month,
            entry.payment.toFixed(2),
            entry.principal.toFixed(2),
            entry.interest.toFixed(2),
            entry.remaining.toFixed(2)
        ]);
    });

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'payment-schedule.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Enter key support
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') calculateEMI();
    });
});
