import { Component, OnInit } from '@angular/core';
import { TodoItem } from './service/todo';
import * as fromTodo from './service/todo';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.less'],
    providers: [fromTodo.TodoService]
})
export class AppComponent implements OnInit {
    inputTodo = '';
    todoItem$: Observable<TodoItem[]>;
    id = 0;

    constructor(private todoStore: fromTodo.TodoService) {
    }

    ngOnInit() {
        this.todoItem$ = this.todoStore.select(fromTodo.getAll);
    }

    add() {
        this.todoStore.dispatch(new fromTodo.AddRequest(this.inputTodo));
        this.inputTodo = '';
    }

    toggleDone(todo: TodoItem) {
        this.todoStore.dispatch(new fromTodo.ToggleDone(todo.id));
    }

    delete(todo: TodoItem) {
        this.todoStore.dispatch(new fromTodo.Delete(todo.id));
    }
}
