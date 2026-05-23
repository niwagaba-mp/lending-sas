/**
 * Repayment Schedule Generator Engine
 * Supports daily, weekly, monthly frequencies
 * Uses flat interest model
 */

function generateRepaymentSchedule(loan, disbursementDate) {
  const {
    principal_amount,
    interest_amount,
    total_repayable,
    installment_count,
    installment_amount,
    repayment_frequency,
  } = loan;

  const principal = parseFloat(principal_amount);
  const interest = parseFloat(interest_amount);
  const instAmt = parseFloat(installment_amount);
  const instCount = parseInt(installment_count);

  const principalPerInst = principal / instCount;
  const interestPerInst = interest / instCount;

  const schedule = [];
  let startDate = new Date(disbursementDate);

  for (let i = 1; i <= instCount; i++) {
    const dueDate = new Date(startDate);

    if (repayment_frequency === 'daily') {
      dueDate.setDate(startDate.getDate() + i);
    } else if (repayment_frequency === 'weekly') {
      dueDate.setDate(startDate.getDate() + i * 7);
    } else {
      // monthly
      dueDate.setMonth(startDate.getMonth() + i);
    }

    const isLast = i === instCount;
    // Last installment absorbs any rounding difference
    const totalDue = isLast
      ? parseFloat((parseFloat(total_repayable) - instAmt * (instCount - 1)).toFixed(2))
      : parseFloat(instAmt.toFixed(2));

    schedule.push({
      installment_number: i,
      due_date: dueDate.toISOString().split('T')[0],
      principal_due: parseFloat(principalPerInst.toFixed(2)),
      interest_due: parseFloat(interestPerInst.toFixed(2)),
      total_due: totalDue,
    });
  }

  return schedule;
}

/**
 * Loan Status Classifier
 * Determines status based on arrears days
 */
function classifyLoanStatus(arrearsDays, outstandingBalance, expectedClosure) {
  const today = new Date();
  const closure = new Date(expectedClosure);

  if (outstandingBalance <= 0) return 'closed';
  if (arrearsDays === 0) return 'active';
  if (arrearsDays >= 1 && arrearsDays <= 7) return 'at_risk';
  if (arrearsDays >= 8 && arrearsDays <= 30) return 'delinquent';
  if (arrearsDays >= 31 && arrearsDays <= 90) return 'defaulted';
  if (arrearsDays > 90) return 'non_performing';
  if (today > closure && outstandingBalance > 0) return 'defaulted';
  return 'active';
}

/**
 * Arrears Engine
 * Calculates arrears for a single loan based on its schedule
 */
function calculateArrears(schedule, totalPaid) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let expectedToDate = 0;
  let missedDueDate = null;

  for (const inst of schedule) {
    const due = new Date(inst.due_date);
    due.setHours(0, 0, 0, 0);
    if (due <= today) {
      expectedToDate += parseFloat(inst.total_due);
      if (!inst.is_paid && !missedDueDate) {
        missedDueDate = inst.due_date;
      }
    }
  }

  const arrearsAmount = Math.max(0, expectedToDate - parseFloat(totalPaid || 0));
  let arrearsDays = 0;

  if (missedDueDate) {
    const missed = new Date(missedDueDate);
    arrearsDays = Math.floor((today - missed) / (1000 * 60 * 60 * 24));
  }

  return { arrearsAmount, arrearsDays, missedDueDate };
}

module.exports = { generateRepaymentSchedule, classifyLoanStatus, calculateArrears };
