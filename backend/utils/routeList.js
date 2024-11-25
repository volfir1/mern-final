// First, create the routeList.js directly in the utils folder
// utils/routeList.js
import Table from 'cli-table3';

export const displayRoutes = (app) => {
    const table = new Table({
        head: ['Method', 'Path', 'Middleware'],
        style: {
            head: ['cyan'],
            border: ['gray']
        }
    });

    const routes = [];

    app._router.stack.forEach((middleware) => {
        if (middleware.route) {
            const middlewares = middleware.route.stack
                .map(handler => handler.name)
                .filter(name => name !== '<anonymous>');

            routes.push({
                method: Object.keys(middleware.route.methods)[0].toUpperCase(),
                path: middleware.route.path,
                middleware: middlewares.join(', ') || 'none'
            });
        } else if (middleware.name === 'router') {
            middleware.handle.stack.forEach((handler) => {
                if (handler.route) {
                    const middlewares = handler.route.stack
                        .map(handler => handler.name)
                        .filter(name => name !== '<anonymous>');

                    routes.push({
                        method: Object.keys(handler.route.methods)[0].toUpperCase(),
                        path: `/api/auth${handler.route.path}`,
                        middleware: middlewares.join(', ') || 'none'
                    });
                }
            });
        }
    });

    routes.sort((a, b) => a.path.localeCompare(b.path));
    
    routes.forEach(route => {
        table.push([route.method, route.path, route.middleware]);
    });

    console.log('\nAPI Routes List:');
    console.log(table.toString());
};