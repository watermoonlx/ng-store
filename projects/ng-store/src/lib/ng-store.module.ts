import { ModuleWithProviders, NgModule } from '@angular/core';



@NgModule({
    declarations: [],
    imports: [
    ],
    exports: []
})
export class NgStoreModule {
    public static forRoot(options?: { enableDevTool: boolean }): ModuleWithProviders<NgStoreModule> {
        (window as any).enableDevTool = !!(options?.enableDevTool);
        return {
            ngModule: NgStoreModule
        };
    }
}
