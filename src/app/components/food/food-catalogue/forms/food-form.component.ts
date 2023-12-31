import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { take } from 'rxjs';

import { FoodService } from 'src/app/services/food.service';
import { CatalogueEntry } from 'src/app/shared/interfaces';

@Component({
  selector: 'app-food-catalogue-form',
  templateUrl: './food-catalogue-form.component.html',
})
export class FoodCatalogueFormComponent implements OnChanges {
  @Input() categoryEntry?: CatalogueEntry;
  @Input() formRole: string = '';
  @Output() ownershipChanged = new EventEmitter<number>();

  catalogueEntry: CatalogueEntry = {} as CatalogueEntry;
  initialValues: CatalogueEntry = {} as CatalogueEntry;
  changeOwnershipButtonDisabled: boolean = false;

  foodForm = new FormGroup({
    id: new FormControl(0),
    name: new FormControl('', [Validators.required]),
    kcals: new FormControl(this.categoryEntry?.id ? this.categoryEntry.kcals : null, [
      Validators.required,
      Validators.pattern(/^\d+$/), // Digits only
    ]),
  });

  constructor(public foodService: FoodService) {}

  // CATALOGUE
  isFormValid(): boolean {
    return this.foodForm.valid && this.checkIfFormChanged();
  }

  checkIfFormChanged() {
    const oldName = this.initialValues.name;
    const oldKcals = this.initialValues.kcals ? this.initialValues.kcals.toString() : '';
    const newName = this.foodForm.value.name;
    const newKcals = this.foodForm.value.kcals ? this.foodForm.value.kcals.toString() : '';
    return oldName !== newName || oldKcals !== newKcals;
  }

  onSubmit() {
    this.foodForm.disable();
    this.changeOwnershipButtonDisabled = true;

    this.foodService.postRequestResult$.pipe(take(1)).subscribe((response) => {
      if (response.result) {
        this.initialValues.kcals = this.foodForm.value.kcals ? parseInt(this.foodForm.value.kcals.toString()) : 0;
        this.initialValues.name = this.foodForm.value.name ? this.foodForm.value.name : '';

        if (response.value) {
          const foodId = parseInt(response.value);
          this.updateCatalogue(foodId);
          this.addFoodIdToCatalogueSelectedSendRequest(foodId);
        }

        this.foodForm.enable();
        this.changeOwnershipButtonDisabled = false;
      } else {
        this.foodForm.enable();
        this.changeOwnershipButtonDisabled = false;
      }
    });

    this.foodService.postCatalogueEntry(this.foodForm.value as CatalogueEntry);
  }

  updateCatalogue(foodId: number) {
    const name = this.foodForm.value.name || '';
    const kcalsStr = this.foodForm.value.kcals || '';
    const kcalsInt = parseInt(kcalsStr.toString());
    const newCatalogueValue: CatalogueEntry = { id: foodId, name: name, kcals: kcalsInt };

    if (this.formRole === 'new') {
      this.foodService.catalogue$$.update((obj) => ({ ...obj, [newCatalogueValue.id]: newCatalogueValue }));
    } else if (this.formRole === 'edit') {
      this.foodService.catalogue$$.update((obj) => {
        obj[newCatalogueValue.id] = newCatalogueValue;
        return obj;
      });
    }
  }

  // USERS CATALOGUE
  checkOwnership() {
    if (this.categoryEntry && this.foodService.catalogueSelectedIds$$().includes(this.categoryEntry.id)) {
      return true;
    }
    return false;
  }

  switchOwnership() {
    const foodId = this.foodForm.value.id || 0;
    if (this.checkOwnership() && foodId > 0) {
      this.removeFoodIdFromCatalogueSelectedSendRequest(foodId);
    } else {
      this.addFoodIdToCatalogueSelectedSendRequest(foodId);
    }
  }

  removeFoodIdFromCatalogueSelectedSendRequest(foodId: number) {
    this.changeOwnershipButtonDisabled = true;

    this.foodService.postRequestResult$.pipe(take(1)).subscribe((response) => {
      if (response.result) {
        this.removeFoodIdFromCatalogueSelectedLocally(foodId);
        this.changeOwnershipButtonDisabled = false;
      } else {
        this.changeOwnershipButtonDisabled = false;
      }
    });

    this.foodService.deleteUserFoodId(foodId);
  }

  removeFoodIdFromCatalogueSelectedLocally(foodId: number) {
    this.foodService.catalogueSelectedIds$$.update((list) => list.filter((item) => item !== foodId));
    this.ownershipChanged.emit(foodId);
  }

  addFoodIdToCatalogueSelectedSendRequest(foodId: number) {
    this.changeOwnershipButtonDisabled = true;

    this.foodService.postRequestResult$.pipe(take(1)).subscribe((response) => {
      if (response.result) {
        this.addFoodIdToCatalogueSelectedLocally(foodId);
        this.changeOwnershipButtonDisabled = false;
      } else {
        this.changeOwnershipButtonDisabled = false;
      }
    });

    this.foodService.putUserFoodId(foodId);
  }

  addFoodIdToCatalogueSelectedLocally(foodId: number) {
    this.foodService.catalogueSelectedIds$$.update((list) => [...list, foodId]);
    this.ownershipChanged.emit(foodId);
  }

  // LIFECYCLE HOOKS
  ngOnChanges(): void {
    if (this.categoryEntry) {
      this.foodForm.patchValue(this.categoryEntry as CatalogueEntry);
      this.initialValues = { ...this.categoryEntry };
    }
  }
}
