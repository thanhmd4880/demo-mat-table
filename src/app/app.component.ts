import { AfterViewInit, Component, ElementRef, HostListener, OnInit, Renderer2, ViewChild } from '@angular/core';
import { MatTable } from '@angular/material';
import { CdkDragStart, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { Sort, MatSort, MatTableDataSource } from '@angular/material';
import { noop as _noop } from 'lodash';
import {SelectionModel} from "@angular/cdk/collections";

export interface PeriodicElement {
    name: string;
    position: number;
    weight: number;
    symbol: string;
}

const ELEMENT_DATA: PeriodicElement[] = [
    {position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H'},
    {position: 2, name: 'Helium', weight: 4.0026, symbol: 'He'},
    {position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li'},
    {position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be'},
    {position: 5, name: 'Boron', weight: 10.811, symbol: 'B'},
    {position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C'},
    {position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N'},
    {position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O'},
    {position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F'},
    {position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne'},
];

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {
    @ViewChild(MatSort) sort: MatSort;
    @ViewChild(MatTable, {read: ElementRef} ) private matTableRef: ElementRef;
    @ViewChild('matTable') private matTable: ElementRef;

    columns: any[] = [
        { field: 'select', width: 200, index: 0, minWidth: 150, sticky: true, resizable: false, reorder: false, sortable: false },
        { field: 'position', width: 200, index: 0, minWidth: 150, sticky: true, resizable: false, reorder: false, sortable: false },
        { field: 'name', width: 150, index: 1, minWidth: 150, sticky: true, resizable: true, reorder: false, sortable: true },
        { field: 'weight', width: 800, index: 2, minWidth: 150, sticky: false, resizable: true, reorder: true, sortable: true},
        { field: 'symbol', width: 500, index: 3, minWidth: 150, sticky: false, resizable: true, reorder: true, sortable: true}
    ];
    displayedColumns: string[] = [];
    dataSource : MatTableDataSource<Element>;
    pressed = false;
    currentResizeIndex: number;
    startX: number;
    startWidth: number;
    isResizingRight: boolean;
    resizableMousemove: () => void;
    resizableMouseup: () => void;
    previousIndex: number;
    sorted = {field: 'name', sortType: 'desc'};
    selection = new SelectionModel<PeriodicElement>(true, []);
    constructor(
        private renderer: Renderer2
    ) { }

    ngOnInit() {
        this.getData();
        this.setDisplayedColumns();
    }

    ngAfterViewInit() {
        this.columns.forEach(( column) => {
            this.setColumnWidth(column);
        });
        setTimeout(() => this.setFullWidth(), 20);
    }

    setDisplayedColumns() {
        this.columns.forEach(( column, index) => {
            column.index = index;
            this.displayedColumns[index] = column.field;
        });
    }
    dragStarted(event: CdkDragStart, index: number ) {
        this.previousIndex = index;
    }

    dropListDropped(event: CdkDropList, index: number) {
        if (!this.columns[index].reorder) {
          return;
        }
        if (event) {
            moveItemInArray(this.columns, this.previousIndex, index);
            this.setDisplayedColumns();
        }
    }
    onResizeColumn(event: any, index: number) {
        this.checkResizing(event, index);
        this.currentResizeIndex = index;
        this.pressed = true;
        this.startX = event.pageX;
        this.startWidth = event.target.parentElement.clientWidth;
        event.preventDefault();
        this.mouseMove(index);
    }

    private checkResizing(event, index) {
        const cellData = this.getCellData(index);
        if (( index === 0 ) || ( Math.abs(event.pageX - cellData.right) < cellData.width / 2 &&  index !== this.columns.length - 1 )) {
            this.isResizingRight = true;
        } else {
            this.isResizingRight = false;
        }
    }

    private getCellData(index: number) {
        const headerRow = this.matTableRef.nativeElement.children[0];
        const cell = headerRow.children[index];
        return cell.getBoundingClientRect();
    }

    mouseMove(index: number) {
        this.resizableMousemove = this.renderer.listen('document', 'mousemove', (event) => {
            if (this.pressed && event.buttons ) {
                const dx = (this.isResizingRight) ? (event.pageX - this.startX) : (-event.pageX + this.startX);
                const width = this.startWidth + dx;
                if ( this.currentResizeIndex === index && width > 50 ) {
                    this.setColumnWidthChanges(index, width);
                }
            }
        });
        this.resizableMouseup = this.renderer.listen('document', 'mouseup', (event) => {
            if (this.pressed) {
                this.pressed = false;
                this.currentResizeIndex = -1;
                this.resizableMousemove();
                this.resizableMouseup();
            }
        });
    }

    setColumnWidthChanges(index: number, width: number) {
        const orgWidth = this.columns[index].width;
        const dx = width - orgWidth;
        if ( dx !== 0 ) {
            this.columns[index].width = width;
            this.setColumnWidth(this.columns[index]);
            this.setFullWidth();
        }
    }

    setColumnWidth(column: any) {
        const columnEls = Array.from( document.getElementsByClassName('mat-column-' + column.field) );
        columnEls.forEach(( el: HTMLDivElement ) => {
            el.style.width = column.width + 'px';
        });
    }

    setFullWidth() {
        let total = 0;
        for (let i = 0; i < this.columns.length; i++) {
            total += this.columns[i].width;
        }
        const clientWidth = this.matTable['_elementRef'].nativeElement.clientWidth - 5;
        if (total < clientWidth) {
            this.columns[this.columns.length - 1].width += clientWidth - total;
            this.setColumnWidth(this.columns[this.columns.length - 1]);
        }
    }

    @HostListener('window:scroll', ['$event'])
    _windowScroll(event) {
        const scroll = event.target.body;
        if (scroll.clientHeight + scroll.scrollTop === scroll.scrollHeight) {
            this.getData();
        }
    }

    getData() {
        const data: any = this.dataSource
            ? [...this.dataSource.data, ...ELEMENT_DATA]
            : ELEMENT_DATA;
        this.dataSource = new MatTableDataSource(data);
        this.dataSource.sort = this.sort;
    }

    ascending(value1, value2) {
        return value1 > value2 ? - 1 : (value1 < value2 ? 1 : 0);
    }

    descending(value1, value2) {
        return value1 < value2 ? - 1 : (value1 > value2 ? 1 : 0);
    }


    /** Whether the number of selected elements matches the total number of rows. */
    isAllSelected() {
        const numSelected = this.selection.selected.length;
        const numRows = this.dataSource.data.length;
        return numSelected === numRows;
    }

    /** Selects all rows if they are not all selected; otherwise clear selection. */
    masterToggle() {
        this.isAllSelected() ?
            this.selection.clear() :
            this.dataSource.data.forEach((row: any) => this.selection.select(row));
    }

    /** The label for the checkbox on the passed row */
    checkboxLabel(row?: PeriodicElement): string {
        if (!row) {
            return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
        }
        return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
    }

}
