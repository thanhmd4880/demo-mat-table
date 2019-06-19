import { AfterViewInit, Component, ElementRef, HostListener, OnInit, Renderer2, ViewChild } from '@angular/core';
import { MatTable } from '@angular/material';
import { CdkDragStart, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';

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
    title = 'Material Table column Resize';
    @ViewChild(MatTable, {read: ElementRef} ) private matTableRef: ElementRef;

    columns: any[] = [
        { field: 'position', width: 200, index: 0, minWidth: 150, sticky: true, resizable: false, reorder: false },
        { field: 'name', width: 70, index: 1, minWidth: 150, sticky: true, resizable: true, reorder: false },
        { field: 'weight', width: 800, index: 2, minWidth: 150, sticky: false, resizable: true, reorder: true },
        { field: 'symbol', width: 1000, index: 3, minWidth: 150, sticky: false, resizable: true, reorder: true }
    ];
    displayedColumns: string[] = [];
    dataSource = ELEMENT_DATA;
    pressed = false;
    currentResizeIndex: number;
    startX: number;
    startWidth: number;
    isResizingRight: boolean;
    resizableMousemove: () => void;
    resizableMouseup: () => void;
    previousIndex: number;

    constructor(
        private renderer: Renderer2
    ) { }

    ngOnInit() {
        this.setDisplayedColumns();
    }

    ngAfterViewInit() {
        // this.setTableResize(this.matTableRef.nativeElement.clientWidth)
        this.columns.forEach(( column) => {
            this.setColumnWidth(column);
        });
    }

    setTableResize(tableWidth: number) {
        let totWidth = 0;
        this.columns.forEach(( column) => {
            totWidth += column.width;
        });
        const del = (tableWidth - 5) - totWidth;
        this.columns.forEach((column) => {
            // column.width *= scale;
            if (column.index === this.columns.length - 1 && del > 0) {
                column.width += del
            }
            this.setColumnWidth(column);
        });
        console.log(this.columns)

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
        console.log(this.columns)
        // setTimeout( () => {
        //   this.columns.forEach(( column) => {
        //         this.setColumnWidth(column);
        //     })
        // }, 500)
    }
    onResizeColumn(event: any, index: number) {
        this.checkResizing(event, index);
        this.currentResizeIndex = index;
        this.pressed = true;
        this.startX = event.pageX;
        console.log(event.target.clientWidth);
        this.startWidth = event.target.parentElement.clientWidth;
        event.preventDefault();
        this.mouseMove(index);
    }

    private checkResizing(event, index) {
        const cellData = this.getCellData(index);
        if ( ( index === 0 ) || ( Math.abs(event.pageX - cellData.right) < cellData.width / 2 &&  index !== this.columns.length - 1 ) ) {
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
        // console.log(width);
        if ( dx !== 0 ) {
            // const j = ( this.isResizingRight ) ? index + 1 : index - 1;
            // const newWidth = this.columns[j].width - dx;
            this.columns[index].width = width;
            this.setColumnWidth(this.columns[index]);
            // this.columns[j].width = newWidth;
            // this.setColumnWidth(this.columns[j]);
        }
    }

    setColumnWidth(column: any) {
        const columnEls = Array.from( document.getElementsByClassName('mat-column-' + column.field) );
        columnEls.forEach(( el: HTMLDivElement ) => {
            el.style.width = column.width + 'px';
        });
    }

    // @HostListener('window:resize', ['$event'])
    // onResize(event) {
    //     this.setTableResize(this.matTableRef.nativeElement.clientWidth);
    // }

}
