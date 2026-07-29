import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormularioCampo } from './formulario-campo';

describe('FormularioCampo', () => {
  let component: FormularioCampo;
  let fixture: ComponentFixture<FormularioCampo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormularioCampo],
    }).compileComponents();

    fixture = TestBed.createComponent(FormularioCampo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
