import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CurrencyFormData } from 'src/app/shared/interfaces';
import { AuthService } from 'src/app/services/auth/auth.service';
import { DataSharingService } from 'src/app/services/data-sharing.service';
import { NotificationsService } from 'src/app/services/notifications.service';

@Component({
  selector: 'app-form-currency',
  templateUrl: './form-currency.component.html',
})
export class FormCurrencyComponent implements OnInit, AfterViewInit {
  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private dataSharingService: DataSharingService,
    private notificationsService: NotificationsService
  ) {}
  token = this.auth.getToken();

  emitCurrenciesChanged() {
    // console.log('emitCurrenciesChanged');
    this.dataSharingService.currenciesChanged.emit();
  }

  @Input() currencyFormData: CurrencyFormData = {
    title: '',
    ticker: '',
    symbol: '',
    symbol_pos: 'prefix',
    whitespace: false,
  };
  @Input() formRole: string = '';
  @Output() confirmationModalOpen = new EventEmitter<boolean>();

  isConfirmationModalOpen: boolean = false;
  actionQuestion: string = '';

  openConfirmationModal(actionQuestion: string) {
    this.actionQuestion = actionQuestion;
    this.isConfirmationModalOpen = true;
  }

  handleConfirmation(result: boolean) {
    if (result) {
      this.deleteCurrency();
    } else {
    }
    this.isConfirmationModalOpen = false;
  }

  isFormValid(): boolean {
    return (
      this.currencyFormData.title !== '' &&
      this.currencyFormData.ticker !== '' &&
      this.currencyFormData.symbol !== '' &&
      this.currencyFormData.symbol_pos !== ''
    );
  }

  clearForm() {
    this.currencyFormData = {
      title: '',
      ticker: '',
      symbol: '',
      symbol_pos: 'prefix',
      whitespace: false,
    };
  }

  onSubmit() {
    if (this.formRole === 'new') {
      this.createCurrency();
    } else if (this.formRole === 'edit') {
      this.updateCurrency();
    }
  }

  createCurrency() {
    if (this.token) {
      this.http
        .post('/api/money/currency', this.currencyFormData, {
          headers: { Authorization: `Bearer ${this.token}` },
        })
        .subscribe({
          next: (response) => {
            // console.log('Ответ от сервера:', response);
            this.notificationsService.addNotification('Валюта успешно cоздана', 'success');
            this.clearForm();
            this.emitCurrenciesChanged();
          },
          error: (error) => {
            console.error('Ошибка при запросе:', error);
            this.notificationsService.addNotification('Ошибка при создании валюты', 'error');
          },
        });
    } else {
      console.error('Токен не найден. Пользователь не авторизован.');
      this.notificationsService.addNotification('Токен не найден. Пользователь не авторизован.', 'error');
    }
  }

  updateCurrency() {
    if (this.token) {
      this.http
        .put(`/api/money/currency/${this.currencyFormData.id}`, this.currencyFormData, {
          headers: { Authorization: `Bearer ${this.token}` },
        })
        .subscribe({
          next: (response) => {
            // console.log('Ответ от сервера:', response);
            this.notificationsService.addNotification('Валюта успешно изменена', 'success');
            this.emitCurrenciesChanged();
          },
          error: (error) => {
            console.error('Ошибка при запросе:', error);
            this.notificationsService.addNotification('Ошибка при обновлении валюты', 'error');
          },
        });
    } else {
      console.error('Токен не найден. Пользователь не авторизован.');
      this.notificationsService.addNotification('Токен не найден. Пользователь не авторизован.', 'error');
    }
  }

  deleteCurrency() {
    if (this.token) {
      this.http
        .delete(`/api/money/currency/${this.currencyFormData.id}`, {
          headers: { Authorization: `Bearer ${this.token}` },
        })
        .subscribe({
          next: (response) => {
            // console.log('Валюта успешно удалена:', response);
            this.notificationsService.addNotification('Валюта успешно удалена', 'success');
            this.emitCurrenciesChanged();
          },
          error: (error) => {
            console.error('Ошибка при удалении валюты:', error);
            this.notificationsService.addNotification('Ошибка при удалении валюты', 'error');
          },
        });
    } else {
      console.error('Токен не найден. Пользователь не авторизован.');
      this.notificationsService.addNotification('Токен не найден. Пользователь не авторизован.', 'error');
    }
  }

  ngOnInit(): void {}
  ngAfterViewInit(): void {}
}