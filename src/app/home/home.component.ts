import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { DataService } from '../services/data.service';
import { AuthenticationService } from '../services/authentication.service';
import { ApiPersonService } from '../services/api-person.service';
import { ApiTransactionsService } from '../services/api-transactions.service';
import { catchError, forkJoin, of, take } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  chartData: any;
  doughnutData: any;
  lineData: any;
  barData: any;
  trendData: any;
  typeData: any;
  debitCreditData: any;
  tableTransactions: any[] = [];
  topAccounts: Array<{ accountNumber: string; balance: number; type?: string }> = [];
  metrics: {
    peopleCount: number;
    accountCount: number;
    totalTransactions: number;
    totalBalance: number;
    totalAmount: number;
  } | null = null;
  
  doughnutOptions: any;
  lineOptions: any;
  barOptions: any;
  
  isAdmin: boolean = false;
  currentPerson: any = null;

  constructor(
    private apichartData: DataService, 
    private authService: AuthenticationService,
    private apiPersonService: ApiPersonService,
    private apiTransactionsService: ApiTransactionsService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    this.isAdmin = user?.role == 'Admin';
    
    if (this.isAdmin) {
      this.loadAdminData();
    } else {
      this.loadUserData();
    }
  }

  loadAdminData(): void {
    this.apichartData.getDashboardData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(
      ({ people, accounts, transactions }) => {
        const metrics = this.buildMetrics(people, accounts, transactions);
        this.metrics = metrics;
        this.setupCharts(metrics);
        this.setupExtraVisuals(accounts, transactions);
      },
      error => {
        console.error('Error fetching chart data:', error);
      }
    );
  }

  loadUserData(): void {
    const userEmail = this.authService.getUser()?.email;
    if (!userEmail) return;

    forkJoin({
      person: this.apiPersonService.getPersonByEmail(userEmail).pipe(take(1)),
      transactions: this.apiTransactionsService.getTransactions(true).pipe(
        take(1),
        catchError(() => of([]))
      )
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ person, transactions }) => {
          if (!person) return;
          this.currentPerson = person;
          const accounts = person.accounts || [];
          const accountNumbers = new Set(
            accounts.map((a: any) => a.accountNumber ?? a.AccountNumber).filter(Boolean)
          );
          const filtered = (transactions || []).filter((t: any) => {
            const acc = t.accountNumber ?? t.AccountNumber;
            return accountNumbers.has(acc);
          });
          const metrics = this.buildMetrics([person], accounts, filtered);
          this.metrics = metrics;
          this.setupCharts(metrics);
          this.setupExtraVisuals(accounts, filtered);
        },
        error: (error) => {
          console.error('Error fetching user data:', error);
        }
      });
  }

  private buildMetrics(people: any[], accounts: any[], transactions: any[]) {
    const totalBalance = accounts.reduce(
      (sum: number, acc: any) => sum + (acc.balance ?? acc.Balance ?? 0),
      0
    );
    const totalTransactions = transactions.length;
    const totalAmount = transactions.reduce((sum: number, t: any) => {
      const amount = t.amount ?? t.Amount ?? 0;
      const type = t.transactionType ?? t.TransactionType ?? '';
      return sum + (type === 'Credit' ? amount : -amount);
    }, 0);

    return {
      peopleCount: Number(people.length),
      accountCount: Number(accounts.length),
      totalTransactions: Number(totalTransactions),
      totalBalance: Number(totalBalance),
      totalAmount: Number(totalAmount)
    };
  }

  setupCharts(data: { peopleCount: number; accountCount: number; totalTransactions: number; totalBalance: number; totalAmount: number; }): void {
    this.chartData = {
      labels: ['People', 'Accounts', 'Transactions'],
      datasets: [
        {
          data: [data.peopleCount, data.accountCount, data.totalTransactions]
        },
        {
          data: [0, data.totalBalance, data.totalAmount]
        }
      ]
    };

    this.setupDoughnutChart(data);
    this.setupLineChart(data);
    this.setupBarChart(data);
  }

  private setupDoughnutChart(data: any): void {
    this.doughnutData = {
      labels: this.isAdmin 
        ? ['People', 'Accounts', 'Transactions']
        : ['My Accounts', 'Total Balance', 'Transactions'],
      datasets: [{
        data: [data.peopleCount, data.accountCount, data.totalTransactions],
        backgroundColor: [
          'rgba(99, 102, 241, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 146, 60, 0.8)'
        ],
        borderColor: [
          'rgb(99, 102, 241)',
          'rgb(34, 197, 94)',
          'rgb(251, 146, 60)'
        ],
        borderWidth: 2,
        hoverBackgroundColor: [
          'rgba(99, 102, 241, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(251, 146, 60, 1)'
        ]
      }]
    };

    this.doughnutOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            font: {
              size: 13,
              family: "'Inter', sans-serif"
            },
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          bodyFont: {
            size: 14
          },
          callbacks: {
            label: (context: any) => {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              
              if (!this.isAdmin && label.includes('Balance')) {
                return `${label}: R${value.toLocaleString()} (${percentage}%)`;
              }
              return `${label}: ${value.toLocaleString()} (${percentage}%)`;
            }
          }
        },
        title: {
          display: true,
          text: this.isAdmin ? 'System Overview' : 'My Dashboard',
          font: {
            size: 16,
            weight: 'bold'
          },
          padding: {
            top: 10,
            bottom: 30
          }
        }
      },
      animation: {
        animateRotate: true,
        animateScale: true
      }
    };
  }

  private setupLineChart(data: any): void {
    this.lineData = {
      labels: ['Start', 'Balance', 'Transactions'],
      datasets: [{
        label: this.isAdmin ? 'Financial Flow' : 'My Financial Flow',
        data: [0, data.totalBalance, data.totalAmount],
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: 'rgb(168, 85, 247)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: 'rgb(168, 85, 247)',
        pointHoverBorderColor: '#fff'
      }]
    };

    this.lineOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          bodyFont: {
            size: 14
          },
          callbacks: {
            label: (context: any) => {
              return `R${context.parsed.y.toLocaleString()}`;
            }
          }
        },
        title: {
          display: true,
          text: this.isAdmin ? 'Financial Overview' : 'My Financial Overview',
          font: {
            size: 16,
            weight: 'bold'
          },
          padding: {
            top: 10,
            bottom: 30
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
            drawBorder: false
          },
          ticks: {
            callback: (value: any) => {
              return 'R' + value.toLocaleString();
            },
            font: {
              size: 12
            }
          }
        },
        x: {
          grid: {
            display: false,
            drawBorder: false
          },
          ticks: {
            font: {
              size: 12
            }
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    };
  }

  private setupBarChart(data: any): void {
    this.barData = {
      labels: this.isAdmin 
        ? ['People', 'Accounts', 'Transactions']
        : ['My Profile', 'My Accounts', 'My Transactions'],
      datasets: [
        {
          label: this.isAdmin ? 'Count' : 'My Count',
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 2,
          data: [data.peopleCount, data.accountCount, data.totalTransactions],
          yAxisID: 'y',
          borderRadius: 8,
          hoverBackgroundColor: 'rgba(59, 130, 246, 1)'
        },
        {
          label: this.isAdmin ? 'Amount (R)' : 'My Amount (R)',
          backgroundColor: 'rgba(236, 72, 153, 0.8)',
          borderColor: 'rgb(236, 72, 153)',
          borderWidth: 2,
          data: [0, data.totalBalance / 1000, data.totalAmount / 1000],
          yAxisID: 'y1',
          borderRadius: 8,
          hoverBackgroundColor: 'rgba(236, 72, 153, 1)'
        }
      ]
    };

    this.barOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            padding: 20,
            font: {
              size: 13,
              family: "'Inter', sans-serif"
            },
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          bodyFont: {
            size: 14
          },
          callbacks: {
            label: (context: any) => {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                if (context.datasetIndex === 1) {
                  label += 'R' + (context.parsed.y * 1000).toLocaleString();
                } else {
                  label += context.parsed.y.toLocaleString();
                }
              }
              return label;
            }
          }
        },
        title: {
          display: true,
          text: this.isAdmin ? 'System Statistics' : 'My Statistics',
          font: {
            size: 16,
            weight: 'bold'
          },
          padding: {
            top: 10,
            bottom: 30
          }
        }
      },
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
            drawBorder: false
          },
          ticks: {
            font: {
              size: 12
            },
            callback: (value: any) => {
              return value.toLocaleString();
            }
          },
          title: {
            display: true,
            text: this.isAdmin ? 'Count' : 'My Count',
            font: {
              size: 13,
              weight: 'bold'
            }
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          beginAtZero: true,
          grid: {
            drawOnChartArea: false,
            drawBorder: false
          },
          ticks: {
            callback: (value: any) => {
              return 'R' + (value * 1000).toLocaleString();
            },
            font: {
              size: 12
            }
          },
          title: {
            display: true,
            text: this.isAdmin ? 'Amount (R)' : 'My Amount (R)',
            font: {
              size: 13,
              weight: 'bold'
            }
          }
        },
        x: {
          grid: {
            display: false,
            drawBorder: false
          },
          ticks: {
            font: {
              size: 12
            }
          }
        }
      }
    };
  }

  private setupExtraVisuals(accounts: any[], transactions: any[]): void {
    this.trendData = this.buildMonthlyTrend(transactions);
    this.debitCreditData = this.buildDebitCredit(transactions);
    this.typeData = this.buildTypeBreakdown(transactions);
    this.topAccounts = this.buildTopAccounts(accounts);
    this.tableTransactions = this.buildRecentTransactions(transactions);
  }

  private buildMonthlyTrend(transactions: any[]): any {
    const now = new Date();
    const labels: string[] = [];
    const totals: number[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      labels.push(d.toLocaleString('en-ZA', { month: 'short' }));
      const monthTotal = transactions.reduce((sum, t) => {
        const dateVal = t.transactionDate ?? t.TransactionDate;
        const dt = dateVal ? new Date(dateVal) : null;
        if (!dt) return sum;
        const tKey = `${dt.getFullYear()}-${dt.getMonth()}`;
        if (tKey !== key) return sum;
        const amount = t.amount ?? t.Amount ?? 0;
        return sum + Math.abs(amount);
      }, 0);
      totals.push(monthTotal);
    }

    return {
      labels,
      datasets: [
        {
          label: 'Monthly Volume (R)',
          data: totals,
          borderColor: '#0ea5e9',
          backgroundColor: 'rgba(14, 165, 233, 0.15)',
          fill: true,
          tension: 0.35,
          borderWidth: 3,
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    };
  }

  private buildDebitCredit(transactions: any[]): any {
    const totals = transactions.reduce(
      (acc, t) => {
        const amount = t.amount ?? t.Amount ?? 0;
        const type = (t.transactionType ?? t.TransactionType ?? '').toLowerCase();
        if (type === 'credit') acc.credit += amount;
        else acc.debit += amount;
        return acc;
      },
      { credit: 0, debit: 0 }
    );

    return {
      labels: ['Credit', 'Debit'],
      datasets: [
        {
          data: [totals.credit, totals.debit],
          backgroundColor: ['rgba(16, 185, 129, 0.85)', 'rgba(239, 68, 68, 0.85)'],
          borderColor: ['#10b981', '#ef4444'],
          borderWidth: 2
        }
      ]
    };
  }

  private buildTypeBreakdown(transactions: any[]): any {
    const counts: Record<string, number> = { Credit: 0, Debit: 0, Transfer: 0 };
    transactions.forEach(t => {
      const type = (t.transactionType ?? t.TransactionType ?? 'Transfer') as string;
      if (!counts[type]) counts[type] = 0;
      counts[type] += 1;
    });

    return {
      labels: Object.keys(counts),
      datasets: [
        {
          data: Object.values(counts),
          backgroundColor: ['#22c55e', '#f97316', '#6366f1'],
          borderWidth: 0
        }
      ]
    };
  }

  private buildTopAccounts(accounts: any[]): Array<{ accountNumber: string; balance: number; type?: string }> {
    return accounts
      .map(acc => ({
        accountNumber: acc.accountNumber ?? acc.AccountNumber ?? '',
        balance: acc.balance ?? acc.Balance ?? 0,
        type: acc.accountType ?? acc.AccountType
      }))
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 5);
  }

  private buildRecentTransactions(transactions: any[]): any[] {
    return [...transactions]
      .map(t => ({
        id: t.transactionId ?? t.TransactionId ?? '',
        amount: t.amount ?? t.Amount ?? 0,
        type: t.transactionType ?? t.TransactionType ?? '',
        date: t.transactionDate ?? t.TransactionDate ?? null,
        description: t.description ?? t.Description ?? ''
      }))
      .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
      .slice(0, 5);
  }
}
