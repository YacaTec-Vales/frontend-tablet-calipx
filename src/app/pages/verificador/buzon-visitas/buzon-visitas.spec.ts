import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuzonVisitas } from './buzon-visitas';

describe('BuzonVisitas', () => {
  let component: BuzonVisitas;
  let fixture: ComponentFixture<BuzonVisitas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuzonVisitas],
    }).compileComponents();

    fixture = TestBed.createComponent(BuzonVisitas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
