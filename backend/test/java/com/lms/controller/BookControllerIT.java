package com.lms.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lms.model.Book;
import com.lms.service.AdminLogService;
import com.lms.service.AuthService;
import com.lms.service.BookService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = BookController.class)
@AutoConfigureMockMvc(addFilters = false)
class BookControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private BookService bookService;

    @MockBean
    private AuthService authService;

    @MockBean
    private AdminLogService adminLogService;

    @Test
    void list_should_return_success_code_and_data() throws Exception {
        Book book = new Book();
        book.setId(1L);
        book.setTitle("Java");
        book.setAuthor("Tom");
        book.setPublisher("Pub");
        book.setIsbn("isbn-1");
        book.setCategory("编程");
        book.setStock(10);
        book.setAvailableStock(8);
        book.setCreatedAt(LocalDateTime.now());
        book.setUpdatedAt(LocalDateTime.now());

        Mockito.when(bookService.list("java")).thenReturn(List.of(book));

        mockMvc.perform(get("/api/books")
                .queryParam("keyword", "java")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value("SUCCESS"))
            .andExpect(jsonPath("$.data[0].title").value("Java"));
    }
}
