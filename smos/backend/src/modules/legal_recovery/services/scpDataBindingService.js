const db = require('../../../config/db');

/**
 * Service to fetch and format real-time loan and client data for SCP document generation.
 */
async function getSCPData(loanId, tenantId) {
    const loanRes = await db.query(`
        SELECT l.*, 
               c.first_name || ' ' || c.last_name as borrower_name,
               c.national_id as borrower_nin,
               c.phone_primary as borrower_phone,
               c.home_address as borrower_address,
               g.full_name as guarantor_name,
               g.national_id as guarantor_nin,
               g.phone as guarantor_phone,
               g.address as guarantor_address
        FROM loans l
        JOIN clients c ON l.client_id = c.id
        LEFT JOIN loan_guarantors g ON l.id = g.loan_id
        WHERE l.id = $1 AND l.tenant_id = $2
    `, [loanId, tenantId]);

    if (loanRes.rows.length === 0) {
        throw new Error(`Loan with ID ${loanId} not found for tenant ${tenantId}`);
    }

    const loan = loanRes.rows[0];

    // Calculate Total_Indebtedness dynamically
    const principal = parseFloat(loan.principal_amount) || 0;
    const interest = parseFloat(loan.interest_amount) || 0;
    const fees = parseFloat(loan.total_fees || 0); // Assuming total_fees exists or fallback to 0
    const totalIndebtedness = principal + interest + fees;

    const generationDate = new Date();
    const deadlineDate = new Date();
    deadlineDate.setDate(generationDate.getDate() + 14);

    const formatDate = (date) => date.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
    });

    return {
        Generation_Date: formatDate(generationDate),
        Deadline_Date: formatDate(deadlineDate),
        Deadline_Time: '5:00 PM',
        Agreement_Ref_Number: `SCP-TRP-${loan.loan_number}-${Date.now().toString().slice(-4)}`,
        Notice_Ref_Number: `SCP-SDN-${loan.loan_number}-${Date.now().toString().slice(-4)}`,
        
        // Borrower KYC
        Borrower_Name: loan.borrower_name,
        Borrower_Address: loan.borrower_address || 'UNSPECIFIED PHYSICAL ADDRESS',
        Borrower_Phone: loan.borrower_phone || 'N/A',
        Borrower_NIN: loan.borrower_nin || 'N/A',
        
        // Guarantor KYC
        Guarantor_Name: loan.guarantor_name || 'N/A',
        Guarantor_Address: loan.guarantor_address || 'N/A',
        Guarantor_Phone: loan.guarantor_phone || 'N/A',
        Guarantor_NIN: loan.guarantor_nin || 'N/A',
        
        // Creditor (Static per requirements)
        Creditor_Name: 'Mr. Niwagaba Felex',
        Creditor_Address: 'Luzira Trading Centre, Nakawa - Kampala',
        Creditor_Contact_Number: '+256 700 000 000',
        Creditor_Email: 'felex@kilimomf.co.ug',
        Felex_NIN: 'CM840123456789',
        
        // Financials
        Total_Indebtedness: totalIndebtedness.toLocaleString(),
        Total_Amount: totalIndebtedness.toLocaleString(),
        Account_Ref_Number: loan.loan_number,
        Date_Signed: formatDate(generationDate),
        
        // Breakdown for table
        Ref_Number_1: loan.loan_number,
        Facility_Description_1: 'Microfinance Credit Facility',
        Amount_1: principal.toLocaleString(),
        Ref_Number_2: 'ACC-INT-FEES',
        Facility_Description_2: 'Accrued Interest & Administrative Fees',
        Amount_2: (interest + fees).toLocaleString(),
        
        // Payment Channels
        Payment_Account_Name: 'Kilimo Microfinance / Niwagaba Felex',
        Payment_Details: 'MTN MoMo: 078XXXXXXX / Stanbic Bank: 903XXXXXXXX'
    };
}

module.exports = { getSCPData };
